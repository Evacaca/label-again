import { Button } from "@/components/ui/button";
import { useLabels } from "../context/labels-context";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useProjects } from "@/context/project-context";

export default function SidebarButtons() {
  const { labels } = useLabels()
  const { exportImage } = useProjects()

  const handleExportLabels = () => {
    if (labels.length === 0) {
      return;
    }
    const json = JSON.stringify(labels);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labels.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <Link to="/" className="block">
        <Button className="w-full" variant="secondary"><Plus /> New Project</Button>
      </Link>
      <Button onClick={handleExportLabels} variant="outline">Export Labels</Button>
      <Button onClick={exportImage}>Export Image</Button>
    </>
  )
}