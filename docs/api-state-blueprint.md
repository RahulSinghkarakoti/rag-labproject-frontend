# API and global state blueprint

This app already has Zustand installed. Use it for application state. Keep the
assistant-ui runtime/store separate: it owns chat/thread state, not projects,
documents, auth, or page data.

## File rules

```text
lib/api.ts       one Axios client: base URL, credentials, JSON, errors
lib/store.ts     Zustand state and actions for shared project data
app/**/page.tsx  page composition and route params only
components/**    render state and call store actions from user events
```

Do not call `fetch` directly from components. Do not put temporary form input,
dialog open state, or hover state in the global store. Keep server data in the
store only when more than one component/page needs it.

## API conventions

- FastAPI returns JSON matching the TypeScript type for that resource.
- Use resource paths such as `GET /api/projects` and `POST /api/projects`.
- Use the matching method from `@/lib/api`: `api.get`, `api.post`, `api.put`,
  `api.patch`, or `api.delete`.
- Pass request data as the second argument to `post`, `put`, and `patch`.
- Axios supplies JSON serialization, headers, cookies, and response parsing.
- Treat non-2xx responses as errors. Show `store.error` in the nearest useful UI.
- Keep auth tokens out of Zustand and localStorage. Use the existing auth/cookie flow.
- Set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI origin, for example
  `http://localhost:8000`.

## Request method convention

```ts
const projects = await api.get<Project[]>("/api/projects");
const created = await api.post<Project, ProjectInput>("/api/projects", input);
await api.put<Project, ProjectInput>(`/api/projects/${id}`, input);
await api.patch<Project, Partial<Project>>(`/api/projects/${id}`, { name });
await api.delete<void>(`/api/projects/${id}`);
```

The method is selected by the helper name. The first generic is the response
type; the second generic is the request-body type for `post`, `put`, and
`patch`. Query parameters go in Axios config:

```ts
api.get<Project[]>("/api/projects", { params: { page: 1 } });
```

## Read flow

```tsx
"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/lib/store";

export function ProjectList() {
  const { projects, status, error, fetchProjects } = useProjectStore();

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  if (status === "loading") return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;
  return projects.map((project) => <p key={project.id}>{project.name}</p>);
}
```

For a page that can mount more than once, add a store-level `loaded` flag or
fetch once in the route owner. Do not add that complexity until duplicate
requests are a real problem.

## Write flow

```tsx
const createProject = useProjectStore((state) => state.createProject);

async function onSubmit(input: { name: string; description: string }) {
  try {
    const project = await createProject(input);
    router.push(`/project/${project.id}`);
  } catch {
    // The store already contains the user-facing error.
  }
}
```

The action calls FastAPI first, then updates the store with the server response.
Do not invent IDs or assume the POST succeeded before the response.

## Read/write checklist

1. Add or confirm the FastAPI route and response shape.
2. Add the TypeScript resource type in `lib/store.ts` (or a nearby type file once there are several resources).
3. Add one API-backed store action.
4. Read with a selector: `useProjectStore((state) => state.projects)`.
5. Call actions from event handlers/effects, never during render.
6. Render loading, error, empty, and success states.
7. Run `npm run build` after wiring the page.

Current starter projects in `app/page.tsx` are local demo data. Replace that
local `useState` with `useProjectStore` after `/api/projects` is available.
