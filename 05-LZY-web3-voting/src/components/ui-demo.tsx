import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UIDemo() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-4xl font-bold">UI Components Demo</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome to Web3 Voting</CardTitle>
          <CardDescription>
            All UI components from shadcn/ui are now configured and ready to
            use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="flex gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
