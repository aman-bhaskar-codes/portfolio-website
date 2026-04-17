"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — MinIO Storage Client (§42)
═══════════════════════════════════════════════════════════

Self-hosted S3-compatible storage for PDF briefs, project screenshots,
Parquet analytics exports, and database backups.

Uses standard boto3 (AWS SDK) — fully S3-compatible.
Zero code change from AWS S3: just change the endpoint_url.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

logger = logging.getLogger("portfolio.storage.minio")


class StorageClient:
    """
    MinIO client using standard boto3 (AWS SDK) — fully S3-compatible.

    Buckets:
      portfolio-briefs:      PDF recruiter briefs (presigned URLs, 1hr TTL)
      portfolio-screenshots: Project screenshots (public read)
      portfolio-analytics:   Parquet exports for DuckDB
      portfolio-backups:     DB dumps (nightly)

    Lifecycle policies:
      briefs/:     Delete after 24 hours (auto-expire)
      analytics/:  Move to cold storage after 90 days
      backups/:    Keep 30 days rolling
    """

    def __init__(self):
        self._client = None
        self._available = False
        self._endpoint_url = "http://localhost:9000"
        self._buckets = {
            "briefs": "portfolio-briefs",
            "screenshots": "portfolio-screenshots",
            "analytics": "portfolio-analytics",
            "backups": "portfolio-backups",
        }

    async def initialize(
        self,
        endpoint_url: str = "http://localhost:9000",
        access_key: str = "",
        secret_key: str = "",
        bucket_briefs: str = "portfolio-briefs",
        bucket_screenshots: str = "portfolio-screenshots",
        bucket_analytics: str = "portfolio-analytics",
        bucket_backups: str = "portfolio-backups",
    ) -> None:
        """Initialize MinIO client and ensure buckets exist."""
        self._endpoint_url = endpoint_url
        self._buckets = {
            "briefs": bucket_briefs,
            "screenshots": bucket_screenshots,
            "analytics": bucket_analytics,
            "backups": bucket_backups,
        }

        if not access_key or not secret_key:
            logger.info("⚠️ MinIO credentials not set — storage disabled")
            return

        try:
            import boto3
            from botocore.config import Config

            self._client = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                config=Config(signature_version="s3v4"),
                region_name="us-east-1",  # MinIO default
            )

            # Ensure buckets exist
            existing = {
                b["Name"]
                for b in self._client.list_buckets().get("Buckets", [])
            }
            for bucket_name in self._buckets.values():
                if bucket_name not in existing:
                    self._client.create_bucket(Bucket=bucket_name)
                    logger.info(f"  Created bucket: {bucket_name}")

            self._available = True
            logger.info(f"✅ MinIO initialized: {endpoint_url}")
        except Exception as e:
            logger.warning(f"⚠️ MinIO init failed (non-fatal): {e}")

    async def upload_brief(
        self, pdf_bytes: bytes, brief_id: str
    ) -> str | None:
        """Upload PDF brief and return 1-hour presigned URL."""
        if not self._available or not self._client:
            return None

        try:
            key = f"briefs/{brief_id}.pdf"
            bucket = self._buckets["briefs"]

            self._client.put_object(
                Bucket=bucket,
                Key=key,
                Body=pdf_bytes,
                ContentType="application/pdf",
            )

            url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=3600,  # 1 hour
            )
            logger.info(f"Brief uploaded: {key}")
            return url
        except Exception as e:
            logger.warning(f"Brief upload failed: {e}")
            return None

    async def upload_screenshot(
        self, image_bytes: bytes, project_id: str, filename: str
    ) -> str | None:
        """Upload project screenshot. Returns direct URL."""
        if not self._available or not self._client:
            return None

        try:
            key = f"screenshots/{project_id}/{filename}"
            bucket = self._buckets["screenshots"]

            # Determine content type
            content_type = "image/png"
            if filename.endswith(".jpg") or filename.endswith(".jpeg"):
                content_type = "image/jpeg"
            elif filename.endswith(".webp"):
                content_type = "image/webp"

            self._client.put_object(
                Bucket=bucket,
                Key=key,
                Body=image_bytes,
                ContentType=content_type,
            )

            url = f"{self._endpoint_url}/{bucket}/{key}"
            logger.info(f"Screenshot uploaded: {key}")
            return url
        except Exception as e:
            logger.warning(f"Screenshot upload failed: {e}")
            return None

    async def upload_parquet(
        self, parquet_bytes: bytes, filename: str
    ) -> bool:
        """Upload Parquet analytics export."""
        if not self._available or not self._client:
            return False

        try:
            key = f"exports/{filename}"
            bucket = self._buckets["analytics"]

            self._client.put_object(
                Bucket=bucket,
                Key=key,
                Body=parquet_bytes,
                ContentType="application/octet-stream",
            )
            logger.info(f"Parquet uploaded: {key}")
            return True
        except Exception as e:
            logger.warning(f"Parquet upload failed: {e}")
            return False

    async def upload_backup(
        self, backup_bytes: bytes, filename: str
    ) -> bool:
        """Upload database backup."""
        if not self._available or not self._client:
            return False

        try:
            key = f"db/{filename}"
            bucket = self._buckets["backups"]

            self._client.put_object(
                Bucket=bucket,
                Key=key,
                Body=backup_bytes,
                ContentType="application/gzip",
            )
            logger.info(f"Backup uploaded: {key}")
            return True
        except Exception as e:
            logger.warning(f"Backup upload failed: {e}")
            return False

    async def get_presigned_url(
        self, bucket_key: str, object_key: str, expires_in: int = 3600
    ) -> str | None:
        """Generate a presigned URL for any object."""
        if not self._available or not self._client:
            return None

        bucket = self._buckets.get(bucket_key, bucket_key)
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )
        except Exception as e:
            logger.warning(f"Presigned URL generation failed: {e}")
            return None

    @property
    def is_available(self) -> bool:
        return self._available


# Module-level singleton
storage_client = StorageClient()
