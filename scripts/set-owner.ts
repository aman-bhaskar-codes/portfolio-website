const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'amanbhaskarcodes@gmail.com';
    console.log(`Updating role for ${email}...`);
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'owner' },
        });
        console.log('Success:', user);
    } catch (e: any) {
        if (e.code === 'P2025') {
            console.log('User not found. Creating user...');
            const user = await prisma.user.create({
                data: {
                    email,
                    role: 'owner',
                    plan: 'pro'
                }
            });
            console.log('Created owner:', user);
        } else {
            console.error(e);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
