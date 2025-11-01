import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Plus } from "lucide-react";

const resources = [
  {
    id: 1,
    category: "AA Meetings",
    title: "Downtown Phoenix AA",
    description: "Daily meetings at 7 PM, beginner-friendly",
    link: "https://example.com/aa-phoenix",
  },
  {
    id: 2,
    category: "NA Meetings",
    title: "Phoenix NA Group",
    description: "Monday, Wednesday, Friday at 6 PM",
    link: "https://example.com/na-phoenix",
  },
  {
    id: 3,
    category: "SMART Recovery",
    title: "SMART Recovery Phoenix",
    description: "Tuesday evenings, science-based approach",
    link: "https://example.com/smart-phoenix",
  },
  {
    id: 4,
    category: "Employment",
    title: "Local Job Resources",
    description: "Employment assistance and job listings",
    link: "https://example.com/employment",
  },
  {
    id: 5,
    category: "Mental Health",
    title: "Community Counseling",
    description: "Affordable therapy and counseling services",
    link: "https://example.com/counseling",
  },
  {
    id: 6,
    category: "Transportation",
    title: "Public Transit Guide",
    description: "Bus routes and schedules",
    link: "https://example.com/transit",
  },
];

export default function Resources() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            Curate and share helpful resources with residents
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {resource.category}
                  </p>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {resource.description}
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Resource
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
