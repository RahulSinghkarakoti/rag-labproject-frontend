"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowUpRight, LogOut, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import SSENotifier from "@/components/SSENotifier";

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
    <main className="min-h-svh bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">RAG Lab</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your projects
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Create a project to organize your documents and chat with your knowledge
              base.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut />
              Logout
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
                  <Plus />
                  {editProjectId ? "Update" : "New"} project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editProjectId ? "Update project" : "Add new project"}
                  </DialogTitle>
                  <DialogDescription>
                    Give your project a name and a short description.
                  </DialogDescription>
                </DialogHeader>
                <form id="new-project" onSubmit={addProject} className="grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    Name
                    <Input
                      autoFocus
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Engineering Docs"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Description
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What will you use this project for?"
                      rows={3}
                    />
                  </label>
                </form>
                <DialogFooter>
                  <Button type="submit" form="new-project">
                    {editProjectId ? "Update" : "Create"} project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete project?</DialogTitle>
                <DialogDescription>This action cannot be reversed.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleDeleteProject}>Delete project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <section aria-label="Projects" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group relative flex items-start gap-3 rounded-lg border bg-card px-4 py-3.5 shadow-xs transition-colors hover:border-foreground/20 hover:bg-accent/30"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                {project.name.slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold leading-5">
                      {project.name}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        >
                          <Pencil className="mr-2 size-4 text-muted-foreground" />
                          <span>Edit</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditProjectId(project.id);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          <span>Delete</span>
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
