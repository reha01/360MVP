import React, { useState, useEffect } from 'react';
import './CampaignDashboard.css';

// Inline styles for modal since Tailwind is not configured
const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px'
    },
    modalCard: {
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '900px',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        border: '1px solid #e5e7eb'
    },
    header: {
        padding: '16px 24px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#111827',
        margin: 0
    },
    headerSubtitle: {
        fontSize: '14px',
        color: '#6b7280',
        marginTop: '4px'
    },
    closeButton: {
        color: '#9ca3af',
        fontSize: '24px',
        fontWeight: 300,
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    body: {
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: '#f9fafb'
    },
    workloadCard: {
        marginBottom: '24px',
        background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #bfdbfe',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    workloadHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
    },
    workloadLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    workloadIcon: {
        fontSize: '24px'
    },
    workloadText: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#1f2937'
    },
    workloadNumber: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2563eb'
    },
    progressBar: {
        height: '12px',
        backgroundColor: '#ffffff',
        borderRadius: '9999px',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)'
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(to right, #3b82f6, #2563eb, #4f46e5)',
        transition: 'width 0.5s ease-out',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    workloadSubtext: {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '8px'
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        marginBottom: '16px'
    },
    sectionHeader: {
        marginBottom: '16px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: 0
    },
    sectionIcon: {
        fontSize: '20px'
    },
    badge: {
        marginLeft: 'auto',
        fontSize: '14px',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '9999px'
    },
    badgeBlue: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8'
    },
    badgeGreen: {
        backgroundColor: '#dcfce7',
        color: '#15803d'
    },
    badgePurple: {
        backgroundColor: '#f3e8ff',
        color: '#7c3aed'
    },
    sectionSubtitle: {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '4px',
        marginLeft: '28px'
    },
    evaluatorChip: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '8px',
        transition: 'all 0.2s'
    },
    evaluatorInfo: {
        flex: 1
    },
    evaluatorName: {
        fontWeight: 600,
        color: '#111827'
    },
    evaluatorEmail: {
        fontSize: '14px',
        color: '#6b7280'
    },
    removeButton: {
        marginLeft: '8px',
        color: '#ef4444',
        backgroundColor: 'transparent',
        border: 'none',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '20px',
        transition: 'all 0.2s'
    },
    emptyState: {
        padding: '24px',
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        color: '#9ca3af',
        fontSize: '14px',
        textAlign: 'center',
        backgroundColor: '#f9fafb'
    },
    checkboxRow: {
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#4b5563',
        cursor: 'pointer'
    },
    searchSection: {
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb'
    },
    searchTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#1f2937',
        marginBottom: '16px'
    },
    searchControls: {
        display: 'flex',
        gap: '12px',
        marginBottom: '12px'
    },
    select: {
        padding: '8px 16px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        color: '#374151',
        fontWeight: 500,
        outline: 'none'
    },
    searchInput: {
        flex: 1,
        padding: '8px 16px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        outline: 'none'
    },
    searchResult: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        background: 'linear-gradient(to right, #eff6ff, #ffffff)',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    addIcon: {
        color: '#2563eb',
        fontSize: '24px',
        fontWeight: 'bold'
    },
    footer: {
        padding: '16px 24px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    btnCancel: {
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        color: '#374151',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    btnPrimary: {
        padding: '8px 20px',
        backgroundColor: '#2563eb',
        border: 'none',
        borderRadius: '8px',
        color: '#ffffff',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    tabContainer: {
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        padding: '0 24px'
    },
    tabButton: {
        padding: '16px 4px',
        marginRight: '24px',
        border: 'none',
        backgroundColor: 'transparent',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        borderBottom: '2px solid transparent',
        color: '#6b7280',
        transition: 'all 0.2s'
    },
    activeTab: {
        color: '#2563eb',
        borderBottom: '2px solid #2563eb'
    },
    readOnlyChip: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#f3f4f6', // Darker gray for read-only
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '8px'
    },
    tableContainer: {
        overflowX: 'auto',
        marginTop: '16px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid #e5e7eb',
        color: '#6b7280',
        fontWeight: 600
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #f3f4f6',
        color: '#374151'
    },
    statusBadge: {
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: '#f3f4f6',
        color: '#6b7280'
    }
};

const EvaluatorManagementModal = ({ isOpen, onClose, evaluatee, allUsers, onSave, outgoingEvaluations, evaluatorRules, jobFamiliesMap, campaignStrategy }) => {
    const [managers, setManagers] = useState([]);
    const [peers, setPeers] = useState([]);
    const [subordinates, setSubordinates] = useState([]);
    const [skipManagerEvaluation, setSkipManagerEvaluation] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing'

    const getJobFamilyName = (user) => {
        if (!user) return '-';
        // 1. Try Lookup by ID
        if (user.jobFamilyId && jobFamiliesMap && jobFamiliesMap[user.jobFamilyId]) {
            return jobFamiliesMap[user.jobFamilyId].name;
        }
        // 2. Try direct properties
        return user.jobFamily ||
            user.jobFamilyName ||
            user.job_family_name ||
            user.family ||
            '-';
    };

    // STRICT FILTER to remove "ghost" evaluations based on Strategy
    const filterRelationsByType = (rawManagers, rawPeers, rawSubords, type) => {
        let managers = [...rawManagers];
        let peers = [...rawPeers];
        let subords = [...rawSubords];

        // Safety check if no type provided (shouldn't happen but safe > sorry)
        if (!type) return { managers, peers, subords };

        // Normalize keys (PEER_TO_PEER vs PEER_ONLY)
        const strategy = type.toUpperCase();

        if (strategy === 'PEER_TO_PEER' || strategy === 'PEERS' || strategy === 'PEER_ONLY') {
            managers = [];
            subords = [];
        } else if (strategy === 'TOP_DOWN' || strategy === 'MANAGER_ONLY') {
            peers = [];
        } else if (strategy === 'SELF_ONLY') {
            managers = [];
            peers = [];
            subords = [];
        }

        return { managers, peers, subords };
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('peer');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (evaluatee) {
            // Apply Strict Filtering based on Strategy
            const finalStrategy = campaignStrategy || evaluatee.campaignStrategy || 'FULL_360';

            // 1. Convert IDs to Objects
            let managerObjs = (evaluatee.managerIds || []).map(id =>
                allUsers.find(u => u.id === id)).filter(Boolean);
            let peerObjs = (evaluatee.peerIds || []).map(id =>
                allUsers.find(u => u.id === id)).filter(Boolean);
            let subObjs = (evaluatee.dependentIds || []).map(id =>
                allUsers.find(u => u.id === id)).filter(Boolean);

            // 2. Filter based on Strategy
            const filtered = filterRelationsByType(managerObjs, peerObjs, subObjs, finalStrategy);

            setManagers(filtered.managers);
            setPeers(filtered.peers);
            setSubordinates(filtered.subords);
            setSkipManagerEvaluation(evaluatee.skipManagerEvaluation || false);
        }
    }, [evaluatee, allUsers, campaignStrategy]);

    useEffect(() => {
        if (searchTerm.trim().length > 1) {
            const lowerTerm = searchTerm.toLowerCase();
            const existingIds = new Set([
                ...managers.map(u => u.id),
                ...peers.map(u => u.id),
                ...subordinates.map(u => u.id)
            ]);

            const results = allUsers.filter(u =>
                u.id !== evaluatee.id &&
                !existingIds.has(u.id) &&
                (u.name.toLowerCase().includes(lowerTerm) || u.email.toLowerCase().includes(lowerTerm))
            );
            setSearchResults(results.slice(0, 5));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, allUsers, evaluatee, managers, peers, subordinates]);

    const handleAdd = (user) => {
        switch (selectedRole) {
            case 'manager':
                setManagers([...managers, user]);
                break;
            case 'peer':
                setPeers([...peers, user]);
                break;
            case 'subordinate':
                setSubordinates([...subordinates, user]);
                break;
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleRemove = (userId, role) => {
        switch (role) {
            case 'manager':
                setManagers(managers.filter(u => u.id !== userId));
                break;
            case 'peer':
                setPeers(peers.filter(u => u.id !== userId));
                break;
            case 'subordinate':
                setSubordinates(subordinates.filter(u => u.id !== userId));
                break;
        }
    };

    const handleSave = () => {
        onSave({
            managerIds: managers.map(u => u.id),
            peerIds: peers.map(u => u.id),
            dependentIds: subordinates.map(u => u.id),
            skipManagerEvaluation
        });
    };

    // Calculate work load
    const totalWorkLoad = managers.length + peers.length + subordinates.length;

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modalCard}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.headerTitle}>{evaluatee?.name}</h2>
                        <p style={styles.headerSubtitle}>{evaluatee?.jobTitle || 'Sin cargo'}</p>
                    </div>
                    <button
                        style={styles.closeButton}
                        onClick={onClose}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        ×
                    </button>
                </div>

                {/* TABS */}
                <div style={styles.tabContainer}>
                    <button
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === 'incoming' ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab('incoming')}
                    >
                        📥 Recibe Feedback
                    </button>
                    <button
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === 'outgoing' ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab('outgoing')}
                    >
                        📤 Debe Evaluar
                    </button>
                    <button
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === 'summary' ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab('summary')}
                    >
                        📊 Resumen Global
                    </button>
                </div>



                {/* Body - Scrollable Content */}
                <div style={styles.body}>

                    {/* VISTA 1: INCOMING (Configuración) */}
                    {activeTab === 'incoming' && (
                        <>
                            {/* Work Load Bar */}
                            <div style={styles.workloadCard}>
                                <div style={styles.workloadHeader}>
                                    <div style={styles.workloadLabel}>
                                        <span style={styles.workloadIcon}>📋</span>
                                        <span style={styles.workloadText}>Total Asignaciones</span>
                                    </div>
                                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                                        {totalWorkLoad}
                                    </span>
                                </div>
                                <div style={{ height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                    {/* Solid bar just to show presence, not progress */}
                                    <div
                                        style={{
                                            height: '100%',
                                            backgroundColor: '#2563eb',
                                            width: '100%', // Full width to indicate "Capacity/Load" not "Progress"
                                            opacity: 0.2
                                        }}
                                    />
                                </div>
                                <p style={styles.workloadSubtext}>Evaluaciones que este usuario recibirá (Incoming)</p>
                            </div>

                            {/* Zone 1: Superiores */}
                            <div style={styles.sectionCard}>
                                <div style={styles.sectionHeader}>
                                    <h4 style={styles.sectionTitle}>
                                        <span style={{ ...styles.sectionIcon, color: '#2563eb' }}>👤</span>
                                        Superiores
                                        <span style={{ ...styles.badge, ...styles.badgeBlue }}>{managers.length}</span>
                                    </h4>
                                    <p style={styles.sectionSubtitle}>Jefes directos</p>
                                </div>
                                <div>
                                    {managers.map(user => (
                                        <div
                                            key={user.id}
                                            style={styles.evaluatorChip}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.borderColor = '#93c5fd';
                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={styles.evaluatorInfo}>
                                                <div style={styles.evaluatorName}>{user.name}</div>
                                                <div style={styles.evaluatorEmail}>{user.email}</div>
                                            </div>
                                            <button
                                                style={styles.removeButton}
                                                onClick={() => handleRemove(user.id, 'manager')}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {managers.length === 0 && (
                                        <div style={styles.emptyState}>Sin superiores asignados</div>
                                    )}
                                </div>
                                <div style={styles.checkboxRow}>
                                    <label style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={skipManagerEvaluation}
                                            onChange={(e) => setSkipManagerEvaluation(e.target.checked)}
                                        />
                                        <span>Este usuario no tiene superior (CEO/Dueño)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Zone 2: Pares */}
                            <div style={styles.sectionCard}>
                                <div style={styles.sectionHeader}>
                                    <h4 style={styles.sectionTitle}>
                                        <span style={{ ...styles.sectionIcon, color: '#16a34a' }}>👥</span>
                                        Pares
                                        <span style={{ ...styles.badge, ...styles.badgeGreen }}>{peers.length}</span>
                                    </h4>
                                    <p style={styles.sectionSubtitle}>Colegas del mismo nivel</p>
                                </div>
                                <div>
                                    {peers.map(user => (
                                        <div
                                            key={user.id}
                                            style={styles.evaluatorChip}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.borderColor = '#86efac';
                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={styles.evaluatorInfo}>
                                                <div style={styles.evaluatorName}>{user.name}</div>
                                                <div style={styles.evaluatorEmail}>{user.email}</div>
                                            </div>
                                            <button
                                                style={styles.removeButton}
                                                onClick={() => handleRemove(user.id, 'peer')}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {peers.length === 0 && (
                                        <div style={styles.emptyState}>Sin pares asignados</div>
                                    )}
                                </div>
                            </div>

                            {/* Zone 3: Equipo */}
                            <div style={styles.sectionCard}>
                                <div style={styles.sectionHeader}>
                                    <h4 style={styles.sectionTitle}>
                                        <span style={{ ...styles.sectionIcon, color: '#7c3aed' }}>🔻</span>
                                        Equipo
                                        <span style={{ ...styles.badge, ...styles.badgePurple }}>{subordinates.length}</span>
                                    </h4>
                                    <p style={styles.sectionSubtitle}>Reportes directos</p>
                                </div>
                                <div>
                                    {subordinates.map(user => (
                                        <div
                                            key={user.id}
                                            style={styles.evaluatorChip}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.borderColor = '#c4b5fd';
                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={styles.evaluatorInfo}>
                                                <div style={styles.evaluatorName}>{user.name}</div>
                                                <div style={styles.evaluatorEmail}>{user.email}</div>
                                            </div>
                                            <button
                                                style={styles.removeButton}
                                                onClick={() => handleRemove(user.id, 'subordinate')}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {subordinates.length === 0 && (
                                        <div style={styles.emptyState}>Sin reportes asignados</div>
                                    )}
                                </div>
                            </div>

                            {/* Search & Add Section */}
                            <div style={styles.searchSection}>
                                <h4 style={styles.searchTitle}>Añadir Evaluador</h4>
                                <div style={styles.searchControls}>
                                    <select
                                        style={styles.select}
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="manager">👤 Superior</option>
                                        <option value="peer">👥 Par</option>
                                        <option value="subordinate">🔻 Equipo</option>
                                    </select>
                                    <input
                                        type="text"
                                        style={styles.searchInput}
                                        placeholder="Buscar por nombre o email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {searchResults.length > 0 && (
                                    <div>
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                style={styles.searchResult}
                                                onClick={() => handleAdd(user)}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(to right, #dbeafe, #eff6ff)';
                                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(to right, #eff6ff, #ffffff)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div style={styles.evaluatorInfo}>
                                                    <div style={styles.evaluatorName}>{user.name}</div>
                                                    <div style={styles.evaluatorEmail}>{user.email}</div>
                                                </div>
                                                <div style={styles.addIcon}>+</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* VISTA 2: OUTGOING (Solo Lectura) */}
                    {activeTab === 'outgoing' && (
                        <>
                            {/* Auto Eval Status */}
                            <div style={styles.sectionCard}>
                                <div style={styles.sectionHeader}>
                                    <h4 style={styles.sectionTitle}>
                                        <span style={{ fontSize: '20px' }}>📝</span>
                                        Autoevaluación
                                        {evaluatorRules?.self ? (
                                            <span style={{ ...styles.badge, ...styles.badgeGreen }}>Activada</span>
                                        ) : (
                                            <span style={{ ...styles.badge, backgroundColor: '#f3f4f6', color: '#6b7280' }}>Desactivada</span>
                                        )}
                                    </h4>
                                    <p style={styles.sectionSubtitle}>¿Este usuario debe evaluarse a sí mismo?</p>
                                </div>
                            </div>

                            {/* --- FILTERED OUTGOING LOGIC --- */}
                            {(() => {
                                const strategy = campaignStrategy || evaluatee?.campaignStrategy || 'FULL_360';

                                const rawManagers = outgoingEvaluations?.managers || [];
                                const rawPeers = outgoingEvaluations?.peers || [];
                                const rawSubords = outgoingEvaluations?.subordinates || [];

                                const { managers: outManagers, peers: outPeers, subords: outSubords } =
                                    filterRelationsByType(rawManagers, rawPeers, rawSubords, strategy);

                                return (
                                    <>
                                        {/* A Jefes */}
                                        <div style={styles.sectionCard}>
                                            <div style={styles.sectionHeader}>
                                                <h4 style={styles.sectionTitle}>
                                                    <span style={{ ...styles.sectionIcon, color: '#2563eb' }}>⬆️</span>
                                                    Evalúa a Jefes
                                                    <span style={{ ...styles.badge, ...styles.badgeBlue }}>{outManagers.length}</span>
                                                </h4>
                                            </div>
                                            {outManagers.map(user => (
                                                <div key={user.id} style={styles.readOnlyChip}>
                                                    <div style={styles.evaluatorInfo}>
                                                        <div style={styles.evaluatorName}>{user.name}</div>
                                                        <div style={styles.evaluatorEmail}>{user.email}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {outManagers.length === 0 && (
                                                <div style={styles.emptyState}>No tiene evaluaciones ascendentes</div>
                                            )}
                                        </div>

                                        {/* A Pares */}
                                        <div style={styles.sectionCard}>
                                            <div style={styles.sectionHeader}>
                                                <h4 style={styles.sectionTitle}>
                                                    <span style={{ ...styles.sectionIcon, color: '#16a34a' }}>↔️</span>
                                                    Evalúa a Pares
                                                    <span style={{ ...styles.badge, ...styles.badgeGreen }}>{outgoingEvaluations?.peers?.length || 0}</span>
                                                </h4>
                                            </div>
                                            {outgoingEvaluations?.peers?.map(user => (
                                                <div key={user.id} style={styles.readOnlyChip}>
                                                    <div style={styles.evaluatorInfo}>
                                                        <div style={styles.evaluatorName}>{user.name}</div>
                                                        <div style={styles.evaluatorEmail}>{user.email}</div>
                                                    </div>
                                                </div>


                                            ))}
                                            {(!outgoingEvaluations?.peers || outgoingEvaluations.peers.length === 0) && (
                                                <div style={styles.emptyState}>No evalúa a ningún par</div>
                                            )}
                                        </div>

                                        {/* A Equipo */}
                                        <div style={styles.sectionCard}>
                                            <div style={styles.sectionHeader}>
                                                <h4 style={styles.sectionTitle}>
                                                    <span style={{ ...styles.sectionIcon, color: '#7c3aed' }}>⬇️</span>
                                                    Evalúa a Equipo
                                                    <span style={{ ...styles.badge, ...styles.badgePurple }}>{outSubords.length}</span>
                                                </h4>
                                            </div>
                                            {outSubords.map(user => (
                                                <div key={user.id} style={styles.readOnlyChip}>
                                                    <div style={styles.evaluatorInfo}>
                                                        <div style={styles.evaluatorName}>{user.name}</div>
                                                        <div style={styles.evaluatorEmail}>{user.email}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {outSubords.length === 0 && (
                                                <div style={styles.emptyState}>No realice evaluaciones descendentes</div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </>
                    )}

                    {/* VISTA 3: RESUMEN GLOBAL */}
                    {activeTab === 'summary' && (
                        <div style={styles.sectionCard}>
                            <div style={styles.sectionHeader}>
                                <h4 style={styles.sectionTitle}>Resumen de Evaluaciones</h4>
                            </div>
                            {(() => {
                                const list = [];
                                const strategy = campaignStrategy || evaluatee?.campaignStrategy || 'FULL_360';

                                // 1. Filtered Incoming State (matches visible tabs)
                                const { managers: filteredManagers, peers: filteredPeers, subords: filteredSubords } =
                                    filterRelationsByType(managers, peers, subordinates, strategy);

                                // 2. Filtered Outgoing (from Props)
                                const rawOutManagers = outgoingEvaluations?.managers || [];
                                const rawOutPeers = outgoingEvaluations?.peers || [];
                                const rawOutSubords = outgoingEvaluations?.subordinates || [];

                                const { managers: outManagers, peers: outPeers, subords: outSubords } =
                                    filterRelationsByType(rawOutManagers, rawOutPeers, rawOutSubords, strategy);


                                // --- INCOMING ---
                                // Auto
                                if (evaluatorRules?.self) {
                                    list.push({
                                        user: { ...evaluatee, name: evaluatee.name, jobTitle: evaluatee.jobTitle, jobFamilyId: evaluatee.jobFamilyId },
                                        relation: 'Autoevaluación',
                                        direction: 'Auto',
                                        status: 'Pendiente',
                                        badgeColor: styles.badgeGreen
                                    });
                                }

                                // Incoming Managers
                                filteredManagers.forEach(u => list.push({
                                    user: u,
                                    relation: 'Recibe de Superior',
                                    direction: 'Incoming',
                                    status: 'Pendiente',
                                    badgeColor: styles.badgeBlue
                                }));

                                // Incoming Peers
                                filteredPeers.forEach(u => list.push({
                                    user: u,
                                    relation: 'Recibe de Par',
                                    direction: 'Incoming',
                                    status: 'Pendiente',
                                    badgeColor: styles.badgeGreen
                                }));

                                // Incoming Team
                                filteredSubords.forEach(u => list.push({
                                    user: u,
                                    relation: 'Recibe de Equipo',
                                    direction: 'Incoming',
                                    status: 'Pendiente',
                                    badgeColor: styles.badgePurple
                                }));

                                // --- OUTGOING ---
                                // Outgoing Managers
                                outManagers.forEach(u => list.push({
                                    user: u,
                                    relation: 'Evalúa a Superior',
                                    direction: 'Outgoing',
                                    status: 'Pendiente',
                                    badgeColor: styles.badgeBlue
                                }));

                                // Outgoing Peers
                                outPeers.forEach(u => list.push({
                                    user: u,
                                    relation: 'Evalúa a Par',
                                    direction: 'Outgoing',
                                    status: 'Pendiente',
                                    badgeColor: styles.badgeGreen
                                }));

                                // Outgoing Team
                                outSubords.forEach(u => list.push({
                                    user: u,
                                    relation: 'Evalúa a Equipo',
                                    direction: 'Outgoing',
                                    status: 'Pendiente',
                                    badgeColor: styles.badgePurple
                                }));

                                return (
                                    <div style={styles.tableContainer}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.th}>Nombre</th>
                                                    <th style={styles.th}>Relación</th>
                                                    <th style={styles.th}>Cargo</th>
                                                    <th style={styles.th}>Familia</th>
                                                    <th style={styles.th}>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {list.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td style={styles.td}>{item.user.name}</td>
                                                        <td style={styles.td}>
                                                            <span style={{ ...styles.badge, ...item.badgeColor }}>
                                                                {item.direction === 'Incoming' ? '◄ ' : item.direction === 'Outgoing' ? '► ' : ''}
                                                                {item.relation}
                                                            </span>
                                                        </td>
                                                        <td style={styles.td}>{item.user.jobTitle || '-'}</td>
                                                        <td style={styles.td}>{getJobFamilyName(item.user)}</td>
                                                        <td style={styles.td}><span style={styles.statusBadge}>{item.status}</span></td>
                                                    </tr>
                                                ))}
                                                {list.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                                            No hay evaluaciones configuradas
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={styles.footer}>
                    <button
                        style={styles.btnCancel}
                        onClick={onClose}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
                    >
                        Cancelar
                    </button>
                    <button
                        style={styles.btnPrimary}
                        onClick={handleSave}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>

    );
};

export default EvaluatorManagementModal;
