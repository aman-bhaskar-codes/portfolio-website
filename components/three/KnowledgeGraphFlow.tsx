"use client";

import React, { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Background,
    Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
    {
        id: 'brain',
        type: 'input',
        data: { label: '🧠 IDENTITY_CORE' },
        position: { x: 250, y: 0 },
        style: { background: '#8B5CF6', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' }
    },
    {
        id: 'rag',
        data: { label: '⚡ RAG_PIPELINE' },
        position: { x: 250, y: 100 },
        style: { background: '#121218', color: '#8B5CF6', border: '1px solid #8B5CF6' }
    },
    {
        id: 'repo',
        data: { label: '📂 REPOMIND' },
        position: { x: 50, y: 200 },
        style: { background: '#121218', color: '#6366F1', border: '1px solid #6366F1' }
    },
    {
        id: 'cogni',
        data: { label: '📂 COGNIBASE' },
        position: { x: 450, y: 200 },
        style: { background: '#121218', color: '#6366F1', border: '1px solid #6366F1' }
    },
    {
        id: 'mem1',
        data: { label: '💾 MEM_BLOCK_01' },
        position: { x: 250, y: 300 },
        style: { background: '#121218', color: '#F472B6', border: '1px solid #F472B6' }
    },
];

const initialEdges = [
    { id: 'e1-2', source: 'brain', target: 'rag', animated: true },
    { id: 'e2-3', source: 'rag', target: 'repo', label: 'indexing' },
    { id: 'e2-4', source: 'rag', target: 'cogni', label: 'indexing' },
    { id: 'e2-5', source: 'rag', target: 'mem1', label: 'memory' },
];

export default function KnowledgeGraphFlow() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="w-full h-[600px] glass-panel rounded-3xl overflow-hidden border border-white/5 bg-black/40">
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <h3 className="text-sm font-bold tracking-widest text-white/40">SYSTEM_FLOW_v1.0</h3>
                <p className="text-[10px] font-mono text-accent">INTERACTIVE_RELATIONSHIP_MAP</p>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                colorMode="dark"
            >
                <Background color="#1A1A24" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
