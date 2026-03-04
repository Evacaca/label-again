import { useProjects } from "@/context/project-context";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const { projects, deleteProject } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    projects.forEach(project => {
      const projectDate = new Date(project.createdAt);
      const diffTime = Math.abs(now.getTime() - projectDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        deleteProject(project.id);
      }
    });
  }, [projects, deleteProject]);

  return (
    <div className="p-4">

      <div className='mb-2 flex items-center justify-between space-y-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Projects</h1>
        <div className='flex items-center space-x-2'>
          <Button onClick={() => navigate({ to: '/' })}>Create</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card key={project.id}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-md font-medium flex items-center'>
                <Badge style={{ backgroundColor: project.matrixColor }} className="h-4 min-w-4 rounded-full px-1 mr-1"></Badge>
                {project.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl font-bold'>Type: {project.type}</div>
              <p className='text-muted-foreground text-xs'>
                Expires: {new Date(new Date(project.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate({ to: '/$labelId', params: { labelId: project.id } })}>
                <Pencil />
              </Button>
              <Button variant="outline"  size="sm" onClick={() => deleteProject(project.id)}>
                <Trash />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

    </div>
  );
}