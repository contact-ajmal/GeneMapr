import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Shield, UserCog, Search, ChevronDown,
    ToggleLeft, ToggleRight, Trash2, Edit3, Check, X,
    Crown, FlaskConical, Eye, Lock, KeyRound, AlertTriangle,
    UserPlus, Plus, Mail, AtSign, Brain, Cpu, Zap,
    CheckCircle2, XCircle, Loader2, EyeOff, Server,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
    listUsers, updateUser, deleteUser, createUser,
    getRoles, createRole, deleteRole, getAllPermissions,
    getLLMConfig, updateLLMConfig, testLLMConfig, getLLMProviders,
    type RolePermissions, type Permission,
    type LLMConfigResponse, type LLMProviderPreset,
} from '../api/admin'
import type { UserResponse } from '../api/auth'

type Tab = 'users' | 'roles' | 'llm'

const ROLE_COLORS: Record<string, string> = {
    admin: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    researcher: 'text-dna-cyan bg-dna-cyan/10 border-dna-cyan/30',
    viewer: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
}

const ROLE_ICONS: Record<string, typeof Crown> = {
    admin: Crown,
    researcher: FlaskConical,
    viewer: Eye,
}

function getRoleColor(role: string) {
    return ROLE_COLORS[role] || 'text-purple-400 bg-purple-400/10 border-purple-400/30'
}


// ═══════════════════════════════════════════════════════
// MODAL OVERLAY
// ═══════════════════════════════════════════════════════
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <motion.div
                    className="relative glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}


// ═══════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════
export default function SettingsPage() {
    const { user: currentUser } = useAuth()
    const [activeTab, setActiveTab] = useState<Tab>('users')

    if (currentUser?.role !== 'admin') {
        return (
            <motion.div
                className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <Lock className="w-16 h-16 text-slate-600" />
                <h2 className="text-xl font-headline font-bold text-slate-300">Access Restricted</h2>
                <p className="text-slate-500 font-body">
                    Only administrators can access user management settings.
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="p-6 max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-headline font-bold text-slate-100 flex items-center gap-3">
                    <UserCog className="w-7 h-7 text-dna-cyan" />
                    Settings & Administration
                </h1>
                <p className="text-slate-400 font-body mt-1">
                    Manage users, roles, and system permissions
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
                {([
                    { key: 'users' as Tab, label: 'User Management', icon: Users },
                    { key: 'roles' as Tab, label: 'Roles & Permissions', icon: Shield },
                    { key: 'llm' as Tab, label: 'LLM Configuration', icon: Brain },
                ]).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm
              transition-all ${activeTab === key
                                ? 'bg-dna-cyan/20 text-dna-cyan shadow-glow-cyan'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'users' ? (
                    <UserManagementTab key="users" currentUserId={currentUser.id} />
                ) : activeTab === 'roles' ? (
                    <RolesTab key="roles" />
                ) : (
                    <LLMConfigTab key="llm" />
                )}
            </AnimatePresence>
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════
// USER MANAGEMENT TAB
// ═══════════════════════════════════════════════════════
function UserManagementTab({ currentUserId }: { currentUserId: string }) {
    const [users, setUsers] = useState<UserResponse[]>([])
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRole, setEditRole] = useState('')
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [showCreateUser, setShowCreateUser] = useState(false)
    const [availableRoles, setAvailableRoles] = useState<RolePermissions[]>([])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const data = await listUsers({
                search: search || undefined,
                role: roleFilter || undefined,
                page,
                page_size: 20,
            })
            setUsers(data.users)
            setTotal(data.total)
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [search, roleFilter, page])

    useEffect(() => { fetchUsers() }, [fetchUsers])
    useEffect(() => {
        getRoles().then(setAvailableRoles).catch(() => { })
    }, [])

    const handleToggleActive = async (user: UserResponse) => {
        try {
            await updateUser(user.id, { is_active: !user.is_active })
            fetchUsers()
        } catch { /* silent */ }
    }

    const handleRoleChange = async (userId: string) => {
        try {
            await updateUser(userId, { role: editRole })
            setEditingId(null)
            fetchUsers()
        } catch { /* silent */ }
    }

    const handleDelete = async (userId: string) => {
        try {
            await deleteUser(userId)
            setConfirmDeleteId(null)
            fetchUsers()
        } catch { /* silent */ }
    }

    const totalPages = Math.ceil(total / 20)

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-dna-cyan/15
              text-slate-100 placeholder-slate-500 font-body text-sm
              focus:outline-none focus:border-dna-cyan/40 transition-colors"
                    />
                </div>

                <div className="relative">
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
                        className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-dna-cyan/15
              text-slate-300 font-body text-sm cursor-pointer
              focus:outline-none focus:border-dna-cyan/40 transition-colors"
                    >
                        <option value="">All Roles</option>
                        {availableRoles.map((r) => (
                            <option key={r.role} value={r.role}>{r.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-body">
                        {total} user{total !== 1 ? 's' : ''}
                    </span>
                    <motion.button
                        onClick={() => setShowCreateUser(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold
              text-white bg-gradient-to-r from-dna-cyan to-blue-600
              hover:from-dna-cyan/90 hover:to-blue-500 shadow-glow-cyan transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Create User
                    </motion.button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left px-5 py-3.5 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="text-left px-5 py-3.5 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="text-left px-5 py-3.5 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3.5 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                            <th className="text-right px-5 py-3.5 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-body">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-body">No users found</td></tr>
                        ) : users.map((user) => {
                            const RoleIcon = ROLE_ICONS[user.role] || Shield
                            const isSelf = user.id === currentUserId
                            return (
                                <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[2%] transition-colors">
                                    {/* User Info */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                        bg-gradient-to-br ${user.is_active
                                                    ? 'from-dna-cyan/20 to-blue-600/20 text-dna-cyan border border-dna-cyan/20'
                                                    : 'from-slate-700 to-slate-800 text-slate-500 border border-slate-600'
                                                }`}>
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-body font-medium text-slate-200">
                                                    {user.full_name}
                                                    {isSelf && <span className="ml-2 text-[10px] text-dna-cyan bg-dna-cyan/10 px-1.5 py-0.5 rounded-full">you</span>}
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-5 py-4">
                                        {editingId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value)}
                                                    className="appearance-none px-2 py-1 rounded-lg bg-white/10 border border-dna-cyan/30
                            text-slate-200 font-body text-sm focus:outline-none"
                                                >
                                                    {availableRoles.map((r) => (
                                                        <option key={r.role} value={r.role}>{r.label}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleRoleChange(user.id)} className="text-dna-green hover:text-dna-green/80">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-300">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-body font-medium ${getRoleColor(user.role)}`}>
                                                <RoleIcon className="w-3.5 h-3.5" />
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace(/_/g, ' ')}
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-body ${user.is_active ? 'text-dna-green' : 'text-dna-magenta'}`}>
                                            <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-dna-green' : 'bg-dna-magenta'}`} />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    {/* Last Login */}
                                    <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : 'Never'}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {!isSelf && (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingId(user.id); setEditRole(user.role) }}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-dna-cyan hover:bg-dna-cyan/10 transition-colors"
                                                        title="Change role"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(user)}
                                                        className={`p-1.5 rounded-lg transition-colors ${user.is_active
                                                            ? 'text-slate-500 hover:text-amber-400 hover:bg-amber-400/10'
                                                            : 'text-slate-500 hover:text-dna-green hover:bg-dna-green/10'
                                                            }`}
                                                        title={user.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {user.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </button>
                                                    {confirmDeleteId === user.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg text-dna-magenta hover:bg-dna-magenta/10 transition-colors" title="Confirm delete">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 transition-colors" title="Cancel">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setConfirmDeleteId(user.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-dna-magenta hover:bg-dna-magenta/10 transition-colors" title="Delete user">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg font-body text-sm transition-colors ${p === page ? 'bg-dna-cyan/20 text-dna-cyan' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            <CreateUserModal
                open={showCreateUser}
                onClose={() => setShowCreateUser(false)}
                onCreated={() => { setShowCreateUser(false); fetchUsers() }}
                availableRoles={availableRoles}
            />
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════
// CREATE USER MODAL
// ═══════════════════════════════════════════════════════
function CreateUserModal({
    open, onClose, onCreated, availableRoles,
}: {
    open: boolean
    onClose: () => void
    onCreated: () => void
    availableRoles: RolePermissions[]
}) {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('researcher')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const resetForm = () => {
        setFullName(''); setEmail(''); setPassword(''); setRole('researcher'); setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await createUser({ full_name: fullName, email, password, role })
            resetForm()
            onCreated()
        } catch (err: any) {
            setError(err.message || 'Failed to create user')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal open={open} onClose={() => { resetForm(); onClose() }}>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-dna-cyan/10 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-dna-cyan" />
                    </div>
                    <div>
                        <h2 className="text-lg font-headline font-bold text-slate-100">Create New User</h2>
                        <p className="text-sm text-slate-500 font-body">Add a researcher, viewer, or admin</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-dna-magenta/10 border border-dna-magenta/30 text-sm text-dna-magenta">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Full Name</label>
                    <input
                        type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. John Doe" required autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
              text-slate-100 placeholder-slate-500 font-body
              focus:outline-none focus:border-dna-cyan/50 focus:ring-1 focus:ring-dna-cyan/30 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="researcher@lab.org" required
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
                text-slate-100 placeholder-slate-500 font-body
                focus:outline-none focus:border-dna-cyan/50 focus:ring-1 focus:ring-dna-cyan/30 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Password</label>
                    <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters" required minLength={8}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
              text-slate-100 placeholder-slate-500 font-body
              focus:outline-none focus:border-dna-cyan/50 focus:ring-1 focus:ring-dna-cyan/30 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                        {availableRoles.map((r) => {
                            const RIcon = ROLE_ICONS[r.role] || Shield
                            return (
                                <button
                                    key={r.role}
                                    type="button"
                                    onClick={() => setRole(r.role)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-body transition-all ${role === r.role
                                        ? `${getRoleColor(r.role)} border-current`
                                        : 'text-slate-500 border-white/5 hover:border-white/10 hover:bg-white/[3%]'
                                        }`}
                                >
                                    <RIcon className="w-5 h-5" />
                                    <span className="font-medium">{r.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => { resetForm(); onClose() }}
                        className="flex-1 py-2.5 rounded-xl font-body text-sm text-slate-400
              border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl font-body text-sm font-semibold text-white
              bg-gradient-to-r from-dna-cyan to-blue-600
              hover:from-dna-cyan/90 hover:to-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-glow-cyan transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {submitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Create User
                            </>
                        )}
                    </motion.button>
                </div>
            </form>
        </Modal>
    )
}


// ═══════════════════════════════════════════════════════
// ROLES & PERMISSIONS TAB
// ═══════════════════════════════════════════════════════
function RolesTab() {
    const [roles, setRoles] = useState<RolePermissions[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedRole, setExpandedRole] = useState<string | null>('admin')
    const [showCreateRole, setShowCreateRole] = useState(false)
    const [confirmDeleteRole, setConfirmDeleteRole] = useState<string | null>(null)

    const fetchRoles = useCallback(async () => {
        try {
            const data = await getRoles()
            setRoles(data)
        } catch { /* silent */ }
        setLoading(false)
    }, [])

    useEffect(() => { fetchRoles() }, [fetchRoles])

    const handleDeleteRole = async (roleName: string) => {
        try {
            await deleteRole(roleName)
            setConfirmDeleteRole(null)
            fetchRoles()
        } catch { /* silent */ }
    }

    if (loading) {
        return <div className="text-center py-12 text-slate-500 font-body">Loading roles...</div>
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500 font-body">
                    {roles.length} role{roles.length !== 1 ? 's' : ''} defined
                </p>
                <motion.button
                    onClick={() => setShowCreateRole(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold
            text-white bg-gradient-to-r from-dna-green to-emerald-600
            hover:from-dna-green/90 hover:to-emerald-500 shadow-glow-green transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="w-4 h-4" />
                    Create Role
                </motion.button>
            </div>

            {/* Role Cards */}
            <div className="grid gap-4">
                {roles.map((role) => {
                    const RoleIcon = ROLE_ICONS[role.role] || Shield
                    const isExpanded = expandedRole === role.role
                    return (
                        <motion.div key={role.role} className="glass-panel rounded-2xl overflow-hidden" layout>
                            {/* Role Header */}
                            <div className="flex items-center">
                                <button
                                    onClick={() => setExpandedRole(isExpanded ? null : role.role)}
                                    className="flex-1 flex items-center gap-4 px-6 py-5 text-left hover:bg-white/[2%] transition-colors"
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getRoleColor(role.role)}`}>
                                        <RoleIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-headline font-bold text-slate-200">{role.label}</h3>
                                            {role.is_system && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400 font-mono">system</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 font-body mt-0.5">{role.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 font-mono">
                                            {role.permissions.length} perm{role.permissions.length !== 1 ? 's' : ''}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {/* Delete custom role */}
                                {!role.is_system && (
                                    <div className="pr-4">
                                        {confirmDeleteRole === role.role ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleDeleteRole(role.role)} className="p-1.5 rounded-lg text-dna-magenta hover:bg-dna-magenta/10" title="Confirm">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setConfirmDeleteRole(null)} className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5" title="Cancel">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDeleteRole(role.role)} className="p-1.5 rounded-lg text-slate-500 hover:text-dna-magenta hover:bg-dna-magenta/10 transition-colors" title="Delete role">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Permissions List */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-5 border-t border-white/5 pt-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {role.permissions.map((perm) => (
                                                    <div key={perm.key} className="flex items-start gap-3 p-3 rounded-xl bg-white/[3%] border border-white/5">
                                                        <KeyRound className="w-4 h-4 text-dna-cyan mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-body font-medium text-slate-300">{perm.label}</p>
                                                            <p className="text-xs text-slate-500 font-body mt-0.5">{perm.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {role.role === 'viewer' && (
                                                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
                                                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-amber-400/80 font-body">
                                                        Viewers have read-only access. They cannot upload samples, modify data, or generate new reports.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>

            {/* Create Role Modal */}
            <CreateRoleModal
                open={showCreateRole}
                onClose={() => setShowCreateRole(false)}
                onCreated={() => { setShowCreateRole(false); fetchRoles() }}
            />
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════
// CREATE ROLE MODAL
// ═══════════════════════════════════════════════════════
function CreateRoleModal({
    open, onClose, onCreated,
}: {
    open: boolean
    onClose: () => void
    onCreated: () => void
}) {
    const [name, setName] = useState('')
    const [label, setLabel] = useState('')
    const [description, setDescription] = useState('')
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
    const [allPerms, setAllPerms] = useState<Permission[]>([])
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        getAllPermissions().then(setAllPerms).catch(() => { })
    }, [])

    const resetForm = () => {
        setName(''); setLabel(''); setDescription(''); setSelectedPerms(new Set()); setError('')
    }

    const togglePerm = (key: string) => {
        setSelectedPerms((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const handleLabelChange = (val: string) => {
        setLabel(val)
        // Auto-generate slug from label
        setName(val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (selectedPerms.size === 0) {
            setError('Select at least one permission')
            return
        }

        setSubmitting(true)
        try {
            await createRole({
                name,
                label,
                description,
                permissions: Array.from(selectedPerms),
            })
            resetForm()
            onCreated()
        } catch (err: any) {
            setError(err.message || 'Failed to create role')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal open={open} onClose={() => { resetForm(); onClose() }}>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-dna-green/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-dna-green" />
                    </div>
                    <div>
                        <h2 className="text-lg font-headline font-bold text-slate-100">Create New Role</h2>
                        <p className="text-sm text-slate-500 font-body">Define custom permissions for a new role</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-dna-magenta/10 border border-dna-magenta/30 text-sm text-dna-magenta">
                        {error}
                    </div>
                )}

                {/* Role Label */}
                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Role Display Name</label>
                    <input
                        type="text" value={label} onChange={(e) => handleLabelChange(e.target.value)}
                        placeholder="e.g., Lab Technician" required autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
              text-slate-100 placeholder-slate-500 font-body
              focus:outline-none focus:border-dna-cyan/50 focus:ring-1 focus:ring-dna-cyan/30 transition-colors"
                    />
                    {name && (
                        <p className="mt-1 text-xs text-slate-500 font-mono flex items-center gap-1">
                            <AtSign className="w-3 h-3" /> Slug: {name}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Description</label>
                    <input
                        type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of what this role can do"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
              text-slate-100 placeholder-slate-500 font-body
              focus:outline-none focus:border-dna-cyan/50 focus:ring-1 focus:ring-dna-cyan/30 transition-colors"
                    />
                </div>

                {/* Permission Picker */}
                <div>
                    <label className="block text-sm font-body font-medium text-slate-300 mb-2">
                        Permissions
                        <span className="text-slate-500 font-normal ml-2">
                            ({selectedPerms.size} selected)
                        </span>
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                        {allPerms.map((perm) => {
                            const selected = selectedPerms.has(perm.key)
                            return (
                                <button
                                    key={perm.key}
                                    type="button"
                                    onClick={() => togglePerm(perm.key)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selected
                                        ? 'bg-dna-cyan/10 border-dna-cyan/30 text-slate-200'
                                        : 'bg-white/[2%] border-white/5 text-slate-400 hover:border-white/10'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${selected
                                        ? 'bg-dna-cyan border-dna-cyan text-white'
                                        : 'border-slate-600'
                                        }`}>
                                        {selected && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-body font-medium">{perm.label}</p>
                                        <p className="text-xs text-slate-500 font-body">{perm.description}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => { resetForm(); onClose() }}
                        className="flex-1 py-2.5 rounded-xl font-body text-sm text-slate-400
              border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl font-body text-sm font-semibold text-white
              bg-gradient-to-r from-dna-green to-emerald-600
              hover:from-dna-green/90 hover:to-emerald-500
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-glow-green transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {submitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Create Role
                            </>
                        )}
                    </motion.button>
                </div>
            </form>
        </Modal>
    )
}


// ═══════════════════════════════════════════════════════
// LLM CONFIGURATION TAB
// ═══════════════════════════════════════════════════════

const PROVIDER_ICONS: Record<string, typeof Brain> = {
    openrouter: Zap,
    openai: Brain,
    anthropic: Cpu,
    google: Brain,
    custom: Server,
}

const PROVIDER_COLORS: Record<string, string> = {
    openrouter: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    openai: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    anthropic: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    google: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    custom: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
}

function LLMConfigTab() {
    const [config, setConfig] = useState<LLMConfigResponse | null>(null)
    const [providers, setProviders] = useState<LLMProviderPreset[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [saved, setSaved] = useState(false)

    // Form state
    const [selectedProvider, setSelectedProvider] = useState('openrouter')
    const [selectedModel, setSelectedModel] = useState('openrouter/auto:free')
    const [displayName, setDisplayName] = useState('Auto (Free)')
    const [apiKey, setApiKey] = useState('')
    const [showApiKey, setShowApiKey] = useState(false)
    const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1')
    const [temperature, setTemperature] = useState(0.4)
    const [maxTokens, setMaxTokens] = useState(1000)
    const [customModelId, setCustomModelId] = useState('')

    useEffect(() => {
        Promise.all([getLLMConfig(), getLLMProviders()])
            .then(([cfg, provs]) => {
                setConfig(cfg)
                setProviders(provs)

                // Populate form from saved config
                setSelectedProvider(cfg.provider)
                setSelectedModel(cfg.model_id)
                setDisplayName(cfg.display_name)
                setBaseUrl(cfg.base_url)
                setTemperature(cfg.temperature)
                setMaxTokens(cfg.max_tokens)

                // For custom provider, populate custom model id
                const prov = provs.find(p => p.provider === cfg.provider)
                if (prov) {
                    const modelMatch = prov.models.find(m => m.id === cfg.model_id)
                    if (!modelMatch && cfg.provider === 'custom') {
                        setCustomModelId(cfg.model_id)
                    }
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const handleProviderChange = (providerKey: string) => {
        const prov = providers.find(p => p.provider === providerKey)
        if (!prov) return

        setSelectedProvider(providerKey)
        setBaseUrl(prov.base_url)
        setTestResult(null)
        setSaved(false)

        if (prov.models.length > 0 && providerKey !== 'custom') {
            setSelectedModel(prov.models[0].id)
            setDisplayName(prov.models[0].name)
        } else {
            setSelectedModel(customModelId || 'custom')
            setDisplayName('Custom Model')
        }
    }

    const handleModelChange = (modelId: string) => {
        const prov = providers.find(p => p.provider === selectedProvider)
        const model = prov?.models.find(m => m.id === modelId)
        setSelectedModel(modelId)
        setDisplayName(model?.name || modelId)
        setTestResult(null)
        setSaved(false)
    }

    const currentProvider = providers.find(p => p.provider === selectedProvider)
    const currentModels = currentProvider?.models || []

    const handleTest = async () => {
        setTesting(true)
        setTestResult(null)
        try {
            const result = await testLLMConfig({
                provider: selectedProvider,
                model_id: selectedProvider === 'custom' ? customModelId : selectedModel,
                api_key: apiKey || undefined,
                base_url: baseUrl,
            })
            setTestResult({
                success: result.success,
                message: result.success
                    ? `Connected! Model replied: "${result.reply}"`
                    : `Failed: ${result.error}`,
            })
        } catch (err: any) {
            setTestResult({ success: false, message: err.message || 'Test failed' })
        } finally {
            setTesting(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const modelId = selectedProvider === 'custom' ? customModelId : selectedModel
            const updated = await updateLLMConfig({
                provider: selectedProvider,
                model_id: modelId,
                display_name: displayName,
                api_key: apiKey || undefined,
                base_url: baseUrl,
                temperature,
                max_tokens: maxTokens,
            })
            setConfig(updated)
            setSaved(true)
            // Clear the saved indicator after 3s
            setTimeout(() => setSaved(false), 3000)
        } catch { /* silent */ } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12 text-slate-500 font-body">Loading LLM configuration...</div>
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
        >
            {/* Current Status */}
            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-1">
                    <Brain className="w-5 h-5 text-dna-cyan" />
                    <h3 className="text-base font-headline font-bold text-slate-200">Active Model</h3>
                    {config?.api_key_set ? (
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-dna-green font-body">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            API Key Configured
                        </span>
                    ) : (
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 font-body">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            No API Key — using fallback responses
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 font-body mb-3">
                    Changes here apply immediately to the AI chat assistant.
                </p>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-white/[3%] border border-white/5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-body mb-0.5">Provider</p>
                        <p className="text-sm text-slate-200 font-body font-medium">{currentProvider?.label || selectedProvider}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[3%] border border-white/5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-body mb-0.5">Model</p>
                        <p className="text-sm text-slate-200 font-body font-medium">{config?.display_name || displayName}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[3%] border border-white/5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-body mb-0.5">Last Updated</p>
                        <p className="text-sm text-slate-200 font-body font-medium">
                            {config?.updated_at
                                ? new Date(config.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Never'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Selection */}
            <div>
                <h3 className="text-sm font-body font-semibold text-slate-300 mb-3">Select Provider</h3>
                <div className="grid grid-cols-5 gap-3">
                    {providers.map((prov) => {
                        const PIcon = PROVIDER_ICONS[prov.provider] || Brain
                        const isSelected = selectedProvider === prov.provider
                        const colors = PROVIDER_COLORS[prov.provider] || PROVIDER_COLORS.custom
                        return (
                            <motion.button
                                key={prov.provider}
                                onClick={() => handleProviderChange(prov.provider)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm font-body transition-all ${isSelected
                                    ? `${colors} border-current shadow-lg`
                                    : 'text-slate-500 border-white/5 hover:border-white/10 hover:bg-white/[3%]'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <PIcon className="w-6 h-6" />
                                <span className="font-medium">{prov.label}</span>
                            </motion.button>
                        )
                    })}
                </div>
                {currentProvider && (
                    <p className="mt-2 text-xs text-slate-500 font-body">{currentProvider.description}</p>
                )}
            </div>

            {/* Model & API Config */}
            <div className="grid grid-cols-2 gap-6">
                {/* Left Column — Model & Key */}
                <div className="space-y-4">
                    {/* Model Selection */}
                    {selectedProvider !== 'custom' ? (
                        <div>
                            <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Model</label>
                            <div className="relative">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    className="w-full appearance-none pl-3 pr-8 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
                    text-slate-200 font-body text-sm cursor-pointer
                    focus:outline-none focus:border-dna-cyan/40 transition-colors"
                                >
                                    {currentModels.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}{m.context_window ? ` (${m.context_window})` : ''}{m.free ? ' ✦ Free' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Model ID</label>
                                <input
                                    type="text"
                                    value={customModelId}
                                    onChange={(e) => { setCustomModelId(e.target.value); setSelectedModel(e.target.value) }}
                                    placeholder="e.g. llama3:70b"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
                    text-slate-100 placeholder-slate-500 font-body
                    focus:outline-none focus:border-dna-cyan/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">Base URL</label>
                                <input
                                    type="url"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="http://localhost:11434/v1"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-dna-cyan/15
                    text-slate-100 placeholder-slate-500 font-body
                    focus:outline-none focus:border-dna-cyan/50 transition-colors"
                                />
                            </div>
                        </>
                    )}

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-body font-medium text-slate-300 mb-1.5">
                            API Key {config?.api_key_set && !apiKey && (
                                <span className="text-xs text-dna-green ml-1">(saved — leave blank to keep)</span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => { setApiKey(e.target.value); setSaved(false) }}
                                placeholder={config?.api_key_set ? '••••••••••••••••••••' : 'sk-...'}
                                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-dna-cyan/15
                  text-slate-100 placeholder-slate-500 font-mono text-sm
                  focus:outline-none focus:border-dna-cyan/50 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column — Parameters */}
                <div className="space-y-4">
                    {/* Temperature */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-body font-medium text-slate-300">Temperature</label>
                            <span className="text-sm font-mono text-dna-cyan">{temperature.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="2" step="0.05"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer
                bg-white/10 accent-dna-cyan [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dna-cyan
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white/20"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-600 font-body">Precise</span>
                            <span className="text-[10px] text-slate-600 font-body">Creative</span>
                        </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-body font-medium text-slate-300">Max Tokens</label>
                            <span className="text-sm font-mono text-dna-cyan">{maxTokens.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="100" max="16000" step="100"
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer
                bg-white/10 accent-dna-cyan [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dna-cyan
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white/20"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-600 font-body">Short</span>
                            <span className="text-[10px] text-slate-600 font-body">Long</span>
                        </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-xl border text-sm font-body ${testResult.success
                                ? 'bg-dna-green/5 border-dna-green/20 text-dna-green'
                                : 'bg-dna-magenta/5 border-dna-magenta/20 text-dna-magenta'
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                {testResult.success ? (
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                )}
                                <p className="break-all">{testResult.message}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <motion.button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm
            text-slate-300 border border-white/10 hover:bg-white/5
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {testing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Zap className="w-4 h-4" />
                    )}
                    Test Connection
                </motion.button>

                <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold
            text-white shadow-glow-cyan transition-all
            disabled:opacity-50 disabled:cursor-not-allowed ${saved
                            ? 'bg-dna-green shadow-glow-green'
                            : 'bg-gradient-to-r from-dna-cyan to-blue-600 hover:from-dna-cyan/90 hover:to-blue-500'
                        }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    {saved ? 'Saved!' : 'Save Configuration'}
                </motion.button>

                {config?.updated_by && (
                    <span className="ml-auto text-xs text-slate-600 font-body">
                        Last updated by {config.updated_by}
                    </span>
                )}
            </div>
        </motion.div>
    )
}

