"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Shield, Bell, Globe, Palette, Key, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Settings {
  site_name: string;
  site_url: string;
  maintenance_mode: boolean;
  allow_anonymous_posts: boolean;
  max_posts_per_day: number;
  max_votes_per_day: number;
  auto_flag_threshold: number;
  profanity_filter_enabled: boolean;
  pii_filter_enabled: boolean;
  onesignal_app_id: string;
  onesignal_api_key: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiClient.get<Settings>("/admin/settings"),
  });

  const [formData, setFormData] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/admin/settings", formData);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-6"><Card className="h-64" /><Card className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-heading">Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="size-5" /> General</CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="site_name">Site Name</Label>
              <Input id="site_name" value={formData.site_name || settings?.site_name || ""} onChange={(e) => setFormData({ ...formData, site_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site_url">Site URL</Label>
              <Input id="site_url" value={formData.site_url || settings?.site_url || ""} onChange={(e) => setFormData({ ...formData, site_url: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Disable all non-admin access</p>
            </div>
            <Switch
              checked={formData.maintenance_mode ?? settings?.maintenance_mode ?? false}
              onCheckedChange={(checked) => setFormData({ ...formData, maintenance_mode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> Trust & Safety</CardTitle>
          <CardDescription>Moderation and safety thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow Anonymous Posts</p>
              <p className="text-sm text-muted-foreground">Users can post anonymously</p>
            </div>
            <Switch
              checked={formData.allow_anonymous_posts ?? settings?.allow_anonymous_posts ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_anonymous_posts: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Profanity Filter</p>
              <p className="text-sm text-muted-foreground">Auto-flag profanity in posts</p>
            </div>
            <Switch
              checked={formData.profanity_filter_enabled ?? settings?.profanity_filter_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, profanity_filter_enabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">PII Detection</p>
              <p className="text-sm text-muted-foreground">Auto-flag phone numbers, emails, addresses</p>
            </div>
            <Switch
              checked={formData.pii_filter_enabled ?? settings?.pii_filter_enabled ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, pii_filter_enabled: checked })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="max_posts_per_day">Max Posts/Day (New Users)</Label>
              <Input id="max_posts_per_day" type="number" value={formData.max_posts_per_day ?? settings?.max_posts_per_day ?? 3} onChange={(e) => setFormData({ ...formData, max_posts_per_day: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_votes_per_day">Max Votes/Day (New Users)</Label>
              <Input id="max_votes_per_day" type="number" value={formData.max_votes_per_day ?? settings?.max_votes_per_day ?? 20} onChange={(e) => setFormData({ ...formData, max_votes_per_day: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auto_flag_threshold">Auto-Flag Threshold</Label>
              <Input id="auto_flag_threshold" type="number" value={formData.auto_flag_threshold ?? settings?.auto_flag_threshold ?? 5} onChange={(e) => setFormData({ ...formData, auto_flag_threshold: parseInt(e.target.value) })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="size-5" /> Notifications (OneSignal)</CardTitle>
          <CardDescription>Push notification configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="onesignal_app_id">OneSignal App ID</Label>
              <Input id="onesignal_app_id" value={formData.onesignal_app_id || settings?.onesignal_app_id || ""} onChange={(e) => setFormData({ ...formData, onesignal_app_id: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onesignal_api_key">OneSignal REST API Key</Label>
              <Input id="onesignal_api_key" type="password" value={formData.onesignal_api_key || settings?.onesignal_api_key || ""} onChange={(e) => setFormData({ ...formData, onesignal_api_key: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="size-5" /> Email (SMTP)</CardTitle>
          <CardDescription>Email delivery configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input id="smtp_host" value={formData.smtp_host || settings?.smtp_host || ""} onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input id="smtp_port" type="number" value={formData.smtp_port ?? settings?.smtp_port ?? 587} onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="smtp_user">SMTP Username</Label>
              <Input id="smtp_user" value={formData.smtp_user || settings?.smtp_user || ""} onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp_password">SMTP Password</Label>
              <Input id="smtp_password" type="password" value={formData.smtp_password || settings?.smtp_password || ""} onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="size-4" />
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}