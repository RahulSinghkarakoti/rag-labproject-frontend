"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowUpRight, LogOut, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { ThemeAccentSelector } from "@/components/theme-accent-selector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/lib/store";

type Project = {
  id: string;
  name: string;
  description: string;
};

export function ProjectsDashboard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [description, setDescription] = useState("");
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const createProject = useProjectStore((state) => state.createProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  async function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const projectName = name.trim();
    if (!projectName) return;
    try {
      if (!editProjectId) {
        const newProj = await createProject({
          name: projectName,
          description: description.trim() || "No description yet.",
        });
        setName("");
        setDescription("");
        setEditProjectId("");
        setOpen(false);
        if (newProj?.id) {
          router.push(`/project/${newProj.id}`);
        }
      } else {
        await updateProject(
          {
            name: projectName,
            description: description.trim() || "No description yet.",
          },
          editProjectId
        );
        setName("");
        setDescription("");
        setEditProjectId("");
        setOpen(false);
      }
    } catch {
      // Error is set in store
    }
  }

  function onEdit(item: Project) {
    setName(item.name);
    setDescription(item.description);
    setEditProjectId(item.id);
    setOpen(true);
  }

  function handleDeleteProject() {
    deleteProject(editProjectId);
    setDeleteOpen(false);
  }

  function handleLogout() {
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="flex min-h-full flex-col justify-between bg-[#0a0a0f] text-[#e0e0e0] font-mono">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
          <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-[#2a2a3a] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block size-2 bg-accent animate-pulse"></span>
                <p className="text-xs font-semibold tracking-widest text-accent uppercase">
                  &gt; LAB.WORKSPACE // ACTIVE_NODES
                </p>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-wider text-foreground sm:text-4xl">
                SYSTEM PROJECTS
              </h1>
              <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                Select or deploy a workspace node to index documents and engage knowledge bases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeAccentSelector />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-3.5" />
                LOGOUT
              </Button>

              <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                  setOpen(nextOpen);
                  if (!nextOpen) {
                    setName("");
                    setDescription("");
                    setEditProjectId("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-3.5" />
                    {editProjectId ? "UPDATE" : "NEW"} PROJECT
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="uppercase tracking-wider text-accent text-base">
                      &gt; {editProjectId ? "UPDATE_NODE" : "NEW_PROJECT_NODE"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Specify workspace designation and metadata parameters.
                    </DialogDescription>
                  </DialogHeader>
                  <form id="new-project" onSubmit={addProject} className="grid gap-4 py-2">
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Project Name
                      <Input
                        autoFocus
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. CORE_ENG_DOCS"
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                      <Textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Node usage parameters..."
                        rows={3}
                      />
                    </label>
                  </form>
                  <DialogFooter>
                    <Button type="submit" form="new-project">
                      {editProjectId ? "EXECUTE_UPDATE" : "INITIALIZE_NODE"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive uppercase tracking-wider">
                    &gt; TERMINATE_NODE?
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Warning: Data destruction is permanent and unrecoverable.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDeleteProject}>
                    CONFIRM_TERMINATE
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>

          <section aria-label="Projects">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#2a2a3a] cyber-chamfer bg-[#12121a]/40">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  // NO_ACTIVE_WORKSPACE_NODES_FOUND
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Deploy a new project node to begin workspace indexing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#2a2a3a] cyber-chamfer bg-[#12121a]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-[#2a2a3a] bg-[#161622] text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Node / Name</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a3a]/60">
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        className="group transition-colors hover:bg-[#1c1c2e]"
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <Link
                            href={`/project/${project.id}`}
                            className="flex items-center gap-3 font-bold uppercase tracking-wider text-foreground hover:text-accent"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center cyber-chamfer-sm bg-accent text-[#0a0a0f] text-xs font-black">
                              {project.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[200px] sm:max-w-xs">{project.name}</span>
                          </Link>
                        </td>

                        <td className="px-4 py-3.5 align-middle text-muted-foreground font-sans max-w-md">
                          <p className="line-clamp-2 text-xs">{project.description}</p>
                        </td>

                        <td className="px-4 py-3.5 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="h-7 text-[10px] tracking-wider px-2.5">
                              <Link href={`/project/${project.id}`}>
                                OPEN
                                <ArrowUpRight className="ml-1 size-3 text-accent" />
                              </Link>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-muted-foreground hover:bg-[#2a2a3a] hover:text-accent"
                                >
                                  <MoreVertical className="size-3.5" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => onEdit(project)}
                                  className="cursor-pointer"
                                >
                                  <Pencil className="mr-2 size-3.5 text-accent" />
                                  <span className="uppercase">Edit</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:bg-destructive/20 focus:text-destructive"
                                  onClick={() => {
                                    setEditProjectId(project.id);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 size-3.5" />
                                  <span className="uppercase">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
