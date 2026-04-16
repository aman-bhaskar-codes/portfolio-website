from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "password"),
)

def add_relation(a: str, b: str, rel: str):
    with driver.session() as s:
        s.run(
            """
            MERGE (x:Node {name:$a})
            MERGE (y:Node {name:$b})
            MERGE (x)-[:REL {type:$r}]->(y)
            """,
            a=a,
            b=b,
            r=rel,
        )

def find_relations(name: str):
    with driver.session() as s:
        res = s.run(
            """
            MATCH (x {name:$n})-[r]->(y)
            RETURN y.name
            """,
            n=name,
        )
        return [i["y.name"] for i in res]
