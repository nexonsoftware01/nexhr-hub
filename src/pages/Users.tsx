import { useState, useEffect } from 'react';
import { usersApi, User } from '@/lib/api';
import { StatusChip } from '@/components/StatusChip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users as UsersIcon, Loader2, Search, Link2, IndianRupee, UserX, AlertTriangle } from 'lucide-react';

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
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    // HR should not see SUPER_ADMIN users
    if (user?.role === 'HR' && u.role === 'SUPER_ADMIN') return false;
    return u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage employees</p>
        </div>
        <div className="flex gap-2">
          <CreateUserDialog onCreated={fetchUsers} />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell><StatusChip status={user.role} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.managerId
                      ? users.find(u => u.id === user.managerId)?.name || `#${user.managerId}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.monthlySalary != null ? (
                      <span className="font-medium">₹{user.monthlySalary.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <AssignManagerDialog userId={user.id} users={users} onAssigned={fetchUsers} />
                      <AssignSalaryDialog userId={user.id} currentSalary={user.monthlySalary} onAssigned={fetchUsers} />
                      <DeactivateButton userId={user.id} userName={user.name} onDeactivated={fetchUsers} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <UsersIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">
            {search ? 'No users match your search' : 'No users found'}
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
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@nexon.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Monthly Salary <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 45000" min="0" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const eligibleManagers = users.filter(u => u.id !== userId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Link2 className="h-3.5 w-3.5" />
          Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Manager</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger><SelectValue placeholder="Select manager..." /></SelectTrigger>
            <SelectContent>
              {eligibleManagers.map(u => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssign} className="w-full" disabled={loading || !managerId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Assign
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
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (o) setSalary(currentSalary ? String(currentSalary) : ''); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          Salary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Salary</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="Monthly salary (₹)" min="1" />
          <Button onClick={handleAssign} className="w-full" disabled={loading || !salary || Number(salary) <= 0}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
          <UserX className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deactivate User
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to deactivate <span className="font-medium text-foreground">{userName}</span>? They will no longer be able to log in.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={handleDeactivate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Deactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
