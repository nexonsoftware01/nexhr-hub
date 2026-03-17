import { useState, useEffect } from 'react';
import { usersApi, User } from '@/lib/api';
import { StatusChip } from '@/components/StatusChip';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users as UsersIcon, Loader2, Search, Link2, IndianRupee, UserX, AlertTriangle, Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = () => {
    setLoading(true);
    usersApi.list()
      .then(res => setUsers(res.data || []))
      .catch(err => handleApiError(err, { title: 'Failed to Load Users' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    if (currentUser?.role === 'HR' && u.role === 'DIRECTOR') return false;
    return u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
  });

  const totalEmployees = users.filter(u => u.role === 'EMPLOYEE').length;
  const totalHR = users.filter(u => u.role === 'HR').length;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <UsersIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">User Management</h1>
              <p className="text-sm text-primary-foreground/60">Create and manage employees</p>
            </div>
          </div>
          <CreateUserDialog onCreated={fetchUsers} />
        </div>
      </div>

      {/* Stats + Search row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-3 flex-1">
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card flex items-center gap-3 min-w-[130px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <UsersIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-card-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card flex items-center gap-3 min-w-[130px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-card-foreground">{totalHR}</p>
              <p className="text-xs text-muted-foreground">HR Staff</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card flex items-center gap-3 min-w-[130px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-card-foreground">{totalEmployees}</p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
          </div>
        </div>
        <div className="relative sm:w-72 self-center">
          <Search className="absolute left-3 top-0 bottom-0 my-auto h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl h-11"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">All Users</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} {filtered.length === 1 ? 'user' : 'users'} {search && 'matching'}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Manager</TableHead>
                  <TableHead className="font-semibold">Salary</TableHead>
                  <TableHead className="text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />{user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusChip status={user.role} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.managerId
                        ? users.find(u => u.id === user.managerId)?.name || `#${user.managerId}`
                        : <span className="text-muted-foreground/40 italic text-xs">Not assigned</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.monthlySalary != null ? (
                        <span className="font-semibold">₹{user.monthlySalary.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {user.id !== currentUser?.userId && (
                          <>
                            <AssignManagerDialog userId={user.id} users={users} onAssigned={fetchUsers} />
                            <AssignSalaryDialog userId={user.id} currentSalary={user.monthlySalary} onAssigned={fetchUsers} />
                            <DeactivateButton userId={user.id} userName={user.name} onDeactivated={fetchUsers} />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <UsersIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {search ? 'No users match your search' : 'No users found'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {search ? 'Try a different search term' : 'Add your first user to get started'}
          </p>
        </div>
      )}
    </div>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const payload: { name: string; email: string; role: string; monthlySalary?: number } = {
        name: name.trim(), email: email.trim(), role,
      };
      if (salary.trim()) payload.monthlySalary = Number(salary);
      await usersApi.create(payload);
      toast({ title: 'User Created', description: `${name} has been added successfully` });
      setName(''); setEmail(''); setRole('EMPLOYEE'); setSalary('');
      setOpen(false);
      onCreated();
    } catch (err: any) {
      handleApiError(err, { title: 'Create User Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-white/10 text-primary-foreground border border-white/10 hover:bg-white/20 backdrop-blur-sm">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            Create New User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@nexon.com" required className="rounded-xl h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Salary <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
              <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="₹ 45,000" min="0" className="rounded-xl h-11" />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 text-base" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Create User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignManagerDialog({ userId, users, onAssigned }: { userId: number; users: User[]; onAssigned: () => void }) {
  const [open, setOpen] = useState(false);
  const [managerId, setManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!managerId) return;
    setLoading(true);
    try {
      await usersApi.assignManager(userId, Number(managerId));
      toast({ title: 'Manager Assigned', description: 'Reporting manager updated successfully' });
      setOpen(false);
      onAssigned();
    } catch (err: any) {
      handleApiError(err, { title: 'Assign Manager Failed' });
    } finally {
      setLoading(false);
    }
  };

  const eligibleManagers = users.filter(u => u.id !== userId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs rounded-lg hover:bg-primary/5 hover:text-primary">
          <Link2 className="h-3.5 w-3.5" />
          Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
              <Link2 className="h-4 w-4" />
            </div>
            Assign Manager
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select manager..." /></SelectTrigger>
            <SelectContent>
              {eligibleManagers.map(u => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssign} className="w-full rounded-xl h-11" disabled={loading || !managerId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
            Assign Manager
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignSalaryDialog({ userId, currentSalary, onAssigned }: { userId: number; currentSalary: number | null; onAssigned: () => void }) {
  const [open, setOpen] = useState(false);
  const [salary, setSalary] = useState(currentSalary ? String(currentSalary) : '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!salary || Number(salary) <= 0) return;
    setLoading(true);
    try {
      await usersApi.assignSalary(userId, Number(salary));
      toast({ title: 'Salary Updated', description: 'Monthly salary updated successfully' });
      setOpen(false);
      onAssigned();
    } catch (err: any) {
      handleApiError(err, { title: 'Update Salary Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (o) setSalary(currentSalary ? String(currentSalary) : ''); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs rounded-lg hover:bg-success/5 hover:text-success">
          <IndianRupee className="h-3.5 w-3.5" />
          Salary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <IndianRupee className="h-4 w-4" />
            </div>
            Assign Salary
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="Monthly salary (₹)" min="1" className="rounded-xl h-11" />
          <Button onClick={handleAssign} className="w-full rounded-xl h-11" disabled={loading || !salary || Number(salary) <= 0}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <IndianRupee className="h-4 w-4 mr-2" />}
            Update Salary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateButton({ userId, userName, onDeactivated }: { userId: number; userName: string; onDeactivated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await usersApi.deactivate(userId);
      toast({ title: 'User Deactivated', description: `${userName} has been deactivated` });
      setOpen(false);
      onDeactivated();
    } catch (err: any) {
      handleApiError(err, { title: 'Deactivation Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs rounded-lg hover:bg-destructive/5 hover:text-destructive text-destructive/70">
          <UserX className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
            Deactivate User
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to deactivate <span className="font-semibold text-foreground">{userName}</span>? They will no longer be able to log in or access any features.
        </p>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" className="flex-1 rounded-xl h-11" onClick={handleDeactivate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
            Deactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
