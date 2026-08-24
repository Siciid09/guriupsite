export interface AdRecord {
  id: string;
  name: string;
  tracking_code: string;
  destination_url: string;
  platform: string;
  status: string;
  cost: number;
  created_at: string;
  visits_count?: number;
  redirects_count?: number;
  first_launches_count?: number;
  signups_count?: number;
  purchases_count?: number;
}

export interface MetricSummary {
  visits: number;
  redirects: number;
  installs: number;
  firstLaunches: number;
  totalLaunches: number;
  signups: number;
  purchases: number;
}