/**
 * @domain tenancy
 * @layer ui
 * @responsibility Tenant design system editor
 */

"use client";

import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { toast } from "sonner";
import { useDesignSystemQuery, useUpdateDesignSystemMutation } from "@afenda/tenancy";
import { routes } from "@afenda/shared/constants";
import { IconDeviceFloppy, IconChevronLeft, IconPalette } from "@tabler/icons-react";
import Link from "next/link";

const fontOptions = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "poppins", label: "Poppins" },
  { value: "open-sans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
];

const radiusOptions = [
  { value: "0", label: "None (0px)" },
  { value: "0.25", label: "Small (4px)" },
  { value: "0.5", label: "Medium (8px)" },
  { value: "0.75", label: "Large (12px)" },
  { value: "1", label: "Extra Large (16px)" },
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto (System)" },
];

export default function DesignSystemEditorPage() {
  const [formData, setFormData] = React.useState({
    style: "default",
    baseColor: "stone",
    brandColor: "emerald",
    theme: "auto",
    menuColor: "#ffffff",
    menuAccent: "#3b82f6",
    menuColorLight: "#ffffff",
    menuColorDark: "#1a1a1a",
    menuAccentLight: "#3b82f6",
    menuAccentDark: "#60a5fa",
    font: "inter",
    radius: "0.5",
  });

  const { data, isLoading } = useDesignSystemQuery();

  const updateMutation = useUpdateDesignSystemMutation({
    onSuccess: () => {
      toast.success("Design system updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update design system", { description: error.message });
    },
  });

  // Populate form with fetched data
  React.useEffect(() => {
    if (data?.designSystem?.settings) {
      const settings = data.designSystem.settings;
      setFormData({
        style: settings.style || "default",
        baseColor: settings.baseColor || "stone",
        brandColor: settings.brandColor || "emerald",
        theme: settings.theme || "auto",
        menuColor: settings.menuColor || "#ffffff",
        menuAccent: settings.menuAccent || "#3b82f6",
        menuColorLight: settings.menuColorLight || "#ffffff",
        menuColorDark: settings.menuColorDark || "#1a1a1a",
        menuAccentLight: settings.menuAccentLight || "#3b82f6",
        menuAccentDark: settings.menuAccentDark || "#60a5fa",
        font: settings.font || "inter",
        radius: String(settings.radius ?? "0.5"),
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateMutation.mutate({
      ...formData,
      radius: Number(formData.radius),
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.root()}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Design System</h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.root()}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <IconPalette className="h-6 w-6" />
              Design System
            </h1>
            <p className="text-sm text-muted-foreground">Customize your tenant&apos;s theme and appearance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Configure the overall theme appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme Mode</Label>
                  <ClientSelect value={formData.theme} onValueChange={(v) => handleChange("theme", v)}>
                    <ClientSelectTrigger id="theme">
                      <ClientSelectValue />
                    </ClientSelectTrigger>
                    <ClientSelectContent>
                      {themeOptions.map(opt => (
                        <ClientSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </ClientSelectItem>
                      ))}
                    </ClientSelectContent>
                  </ClientSelect>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseColor">Base Color</Label>
                    <ClientSelect value={formData.baseColor} onValueChange={(v) => handleChange("baseColor", v)}>
                      <ClientSelectTrigger id="baseColor">
                        <ClientSelectValue />
                      </ClientSelectTrigger>
                      <ClientSelectContent>
                        <ClientSelectItem value="stone">Stone</ClientSelectItem>
                        <ClientSelectItem value="gray">Gray</ClientSelectItem>
                        <ClientSelectItem value="zinc">Zinc</ClientSelectItem>
                        <ClientSelectItem value="slate">Slate</ClientSelectItem>
                        <ClientSelectItem value="neutral">Neutral</ClientSelectItem>
                      </ClientSelectContent>
                    </ClientSelect>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandColor">Brand Color</Label>
                    <ClientSelect value={formData.brandColor} onValueChange={(v) => handleChange("brandColor", v)}>
                      <ClientSelectTrigger id="brandColor">
                        <ClientSelectValue />
                      </ClientSelectTrigger>
                      <ClientSelectContent>
                        <ClientSelectItem value="emerald">Emerald</ClientSelectItem>
                        <ClientSelectItem value="blue">Blue</ClientSelectItem>
                        <ClientSelectItem value="violet">Violet</ClientSelectItem>
                        <ClientSelectItem value="rose">Rose</ClientSelectItem>
                        <ClientSelectItem value="orange">Orange</ClientSelectItem>
                      </ClientSelectContent>
                    </ClientSelect>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Menu Colors</CardTitle>
                <CardDescription>
                  Customize navigation menu appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="menuColorLight">Menu (Light)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="menuColorLight"
                        type="color"
                        value={formData.menuColorLight}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuColorLight", e.target.value)}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={formData.menuColorLight}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuColorLight", e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menuColorDark">Menu (Dark)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="menuColorDark"
                        type="color"
                        value={formData.menuColorDark}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuColorDark", e.target.value)}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={formData.menuColorDark}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuColorDark", e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="menuAccentLight">Accent (Light)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="menuAccentLight"
                        type="color"
                        value={formData.menuAccentLight}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuAccentLight", e.target.value)}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={formData.menuAccentLight}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuAccentLight", e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menuAccentDark">Accent (Dark)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="menuAccentDark"
                        type="color"
                        value={formData.menuAccentDark}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuAccentDark", e.target.value)}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={formData.menuAccentDark}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("menuAccentDark", e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography & Spacing</CardTitle>
                <CardDescription>
                  Configure fonts and border radius
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="font">Font Family</Label>
                  <ClientSelect value={formData.font} onValueChange={(v) => handleChange("font", v)}>
                    <ClientSelectTrigger id="font">
                      <ClientSelectValue />
                    </ClientSelectTrigger>
                    <ClientSelectContent>
                      {fontOptions.map(opt => (
                        <ClientSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </ClientSelectItem>
                      ))}
                    </ClientSelectContent>
                  </ClientSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius">Border Radius</Label>
                  <ClientSelect value={formData.radius} onValueChange={(v) => handleChange("radius", v)}>
                    <ClientSelectTrigger id="radius">
                      <ClientSelectValue />
                    </ClientSelectTrigger>
                    <ClientSelectContent>
                      {radiusOptions.map(opt => (
                        <ClientSelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </ClientSelectItem>
                      ))}
                    </ClientSelectContent>
                  </ClientSelect>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  <IconDeviceFloppy className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Theme"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your theme will look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: formData.theme === 'dark' ? formData.menuColorDark : formData.menuColorLight,
                  borderColor: formData.brandColor,
                  borderRadius: `${Number(formData.radius) * 16}px`,
                }}
              >
                <div className="space-y-3">
                  <Button 
                    style={{
                      backgroundColor: formData.brandColor,
                      borderRadius: `${Number(formData.radius) * 16}px`,
                    }}
                    className="w-full text-white"
                  >
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline"
                    style={{
                      borderColor: formData.brandColor,
                      borderRadius: `${Number(formData.radius) * 16}px`,
                    }}
                    className="w-full"
                  >
                    Outline Button
                  </Button>
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: formData.theme === 'dark' ? formData.menuAccentDark : formData.menuAccentLight,
                      borderRadius: `${Number(formData.radius) * 16}px`,
                      color: '#ffffff',
                    }}
                  >
                    Accent Element
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Some changes may require a page refresh to take full effect.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
