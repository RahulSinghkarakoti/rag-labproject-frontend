"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowUpRight, LogOut, MoreVertical, Pencil, Plus, Trash2, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export default function Home() {
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

  function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const projectName = name.trim();
    if (!projectName) return;
    if (!editProjectId) {
      createProject({
        name: projectName,
        description: description.trim() || "No description yet.",
      });
    } else {
      updateProject(
        {
          name: projectName,
          description: description.trim() || "No description yet.",
        },
        editProjectId
      );
    }
    setName("");
    setDescription("");
    setEditProjectId("");
    setOpen(false);
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
    <main className="min-h-svh bg-[#0a0a0f] text-[#e0e0e0] font-mono">
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

        <section aria-label="Projects" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group relative flex items-start gap-3.5 cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-4 transition-none hover:border-accent hover:bg-[#1c1c2e]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center cyber-chamfer-sm bg-accent text-[#0a0a0f] text-xs font-black">
                {project.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-accent">
                      {project.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground font-sans">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <ArrowUpRight className="size-4 text-accent opacity-0 transition-none group-hover:opacity-100" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:bg-[#2a2a3a] hover:text-accent"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <MoreVertical className="size-3.5" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit(project);
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 size-3.5 text-accent" />
                          <span className="uppercase">Edit</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:bg-destructive/20 focus:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
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
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
