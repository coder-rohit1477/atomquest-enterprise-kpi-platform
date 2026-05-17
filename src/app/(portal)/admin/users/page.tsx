import { getUsers } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Enterprise User Directory</h1>
        <p className="text-slate-500 mt-2 font-medium">Global view of all portal users, hierarchical relationships, and system roles.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{users.filter(u => u.role === "MANAGER").length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{users.filter(u => u.role === "ADMIN").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-lg font-bold text-slate-900">Identity & Access Grid</CardTitle>
          <p className="text-sm text-slate-400 font-medium italic">Operational status of all system identities</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Role</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Manager</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Active Goals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-slate-100">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="bg-slate-100 text-slate-900 font-bold">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={`${
                        user.role === "ADMIN" ? "bg-emerald-100 text-emerald-700" :
                        user.role === "MANAGER" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      } border-none font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      {user.manager ? (
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-blue-500" />
                           <span className="text-sm font-medium text-slate-600">{user.manager.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-bold text-slate-900">{user._count.goals}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
