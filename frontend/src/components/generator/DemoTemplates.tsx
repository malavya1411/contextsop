import React from "react";
import { Terminal, Database, Server, Cpu, Layers } from "lucide-react";

export interface Template {
  name: string;
  description: string;
  category: "kubernetes" | "database" | "docker" | "infrastructure" | "application";
  logContent: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedTime: string;
}

const templates: Template[] = [
  {
    name: "Kubernetes CrashLoopBackOff",
    description: "payment-service pod is crashing with Out Of Memory (Exit Code 137) due to a spike in batch transaction volume.",
    category: "kubernetes",
    difficulty: "Medium",
    estimatedTime: "2 min",
    logContent: `[2026-07-16T15:20:10Z] SYSTEM: ALERT - deployment/payment-service replicas degraded. 1/3 available.
alex [15:20]: payment-service pod is crashlooping in prod-eu! Any changes deployed recently?
priya [15:21]: No code deploys in the last 4 hours, but we did see a spike in bulk payment processing runs around 15:15.
priya [15:21]: Let me inspect the pod events to see what's causing the CrashLoopBackOff.
$ kubectl describe pod payment-service-5c6d7b8-x9z2 -n prod-eu
...
Containers:
  payment-service:
    Container ID:   containerd://e984f128ca87ad
    Image:          internal-registry.company.com/finance/payment-service:v3.2.1
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Thu, 16 Jul 2026 15:18:22 +0000
      Finished:     Thu, 16 Jul 2026 15:19:55 +0000
    Limits:
      cpu:     1
      memory:  512Mi
    Requests:
      cpu:     500m
      memory:  256Mi
...
priya [15:22]: Confirmed OOMKilled — Exit Code 137. The memory limit of 512Mi is too low for the current volume of transactions.
alex [15:23]: We need to increase the memory limit to 1Gi. Let's patch the deployment resource specs.
$ kubectl patch deployment payment-service -n prod-eu --patch '{"spec":{"template":{"spec":{"containers":[{"name":"payment-service","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
deployment.apps/payment-service patched
$ kubectl rollout status deployment/payment-service -n prod-eu --timeout=60s
Waiting for deployment "payment-service" rollout to finish: 1 old replicas are pending termination...
deployment "payment-service" successfully rolled out
priya [15:25]: The patched pods are running, and memory usage has stabilized at around 680Mi. No more crashes.
alex [15:27]: Excellent. Closing out the incident.`,
  },
  {
    name: "Redis Memory & Client Latency Failure",
    description: "Redis cache instance has exhausted maximum memory limit and is rejecting new client connections.",
    category: "database",
    difficulty: "Hard",
    estimatedTime: "3 min",
    logContent: `[2026-07-16T16:01:05Z] SYSTEM: EXCEPTION - redis.exceptions.ConnectionError: Connection closed by server.
dave [16:01]: redis-cache latency spiked, getting ConnectionTimeoutException from the session middleware.
sarah [16:02]: Is it maxclients or memory eviction? Let's check the current info stats on the server.
$ redis-cli -h redis-prod.internal.net INFO | grep -E "connected_clients|used_memory|maxmemory|evicted_keys"
connected_clients:9982
used_memory:8587934208
used_memory_human:8.00G
maxmemory:8587934592
maxmemory_human:8.00G
evicted_keys:0
sarah [16:03]: It's at exactly 8GB (max memory) and evicted_keys is 0! The eviction policy must be set to noeviction.
dave [16:04]: Yes, that's preventing keys from being cleared, causing Redis to reject write commands.
dave [16:04]: We should change the policy to allkeys-lru temporarily so expired sessions are discarded.
$ redis-cli -h redis-prod.internal.net config set maxmemory-policy allkeys-lru
OK
$ redis-cli -h redis-prod.internal.net CLIENT KILL TYPE normal
(integer) 8402
sarah [16:07]: Checked the memory usage again. It has dropped down to 6.2GB and evicted_keys has climbed.
dave [16:08]: Clients are re-connecting successfully now. Latency is back to normal (< 5ms).`,
  },
  {
    name: "Docker Deployment Failure",
    description: "Multi-stage Docker deployment fails on launch due to missing built artifacts in final runner stage.",
    category: "docker",
    difficulty: "Medium",
    estimatedTime: "2 min",
    logContent: `[2026-07-16T14:10:00Z] SYSTEM: DEPLOYMENT - frontend-app rollout failed on docker-host-03.
tim [14:10]: new frontend deploy failed to start on docker-host-03. Docker container starts but exits immediately.
anna [14:11]: Let me check the container stdout logs.
$ docker logs frontend-container-prod
Error: Cannot find module './dist/server.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1225:15)
    at Module._load (node:internal/modules/cjs/loader:1051:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:174:12)
    at node:internal/main/run_main_module:28:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! frontend-app@2.1.0 start: \`node dist/server.js\`
npm ERR! Exit status 1
anna [14:12]: Ah! The build stage compiled the TypeScript files, but the runner stage didn't copy the dist directory!
tim [14:13]: Let's check the Dockerfile.
$ cat Dockerfile
...
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/package.json ./package.json
# MISSING: COPY --from=builder /app/dist ./dist
CMD ["npm", "run", "start"]
...
anna [14:15]: Fixed it. Adding the COPY instruction to copy built code to runner.
$ git diff Dockerfile
@@ -15,4 +15,5 @@
 FROM node:20-alpine AS runner
 WORKDIR /app
 COPY package*.json ./
 RUN npm ci --only=production
 COPY --from=builder /app/package.json ./package.json
+COPY --from=builder /app/dist ./dist
 CMD ["npm", "run", "start"]
$ docker build -t internal-registry.company.com/frontend/app:v2.1.1 .
$ docker push internal-registry.company.com/frontend/app:v2.1.1
tim [14:17]: Deployed v2.1.1 successfully to docker-host-03. Running healthy on port 3000.`,
  },
  {
    name: "AWS RDS High CPU Recovery",
    description: "PostgreSQL RDS database CPU utilization spikes to 100%, causing backend API timeouts.",
    category: "database",
    difficulty: "Hard",
    estimatedTime: "3 min",
    logContent: `[2026-07-16T09:30:15Z] SYSTEM: ALERT - RDS instance CPU utilization is 99.8%.
mark [09:30]: RDS cpu is at 100%, api is throwing 504 gateway timeout errors in prod-us.
lucas [09:32]: Let's find the active long-running queries causing the CPU consumption.
$ aws rds describe-db-instances --db-instance-identifier prod-db-instance --query "DBInstances[0].DBInstanceStatus"
"available"
$ psql -h prod-db.amazonaws.com -U postgres -d core_prod -c "SELECT pid, age(clock_timestamp(), query_start), state, substring(query, 1, 60) FROM pg_stat_activity WHERE state != 'idle' ORDER BY age DESC LIMIT 5;"
 pid  |       age       | state  |                         substring
------+-----------------+--------+-------------------------------------------------------------
 4021 | 00:15:32.427181 | active | SELECT * FROM orders JOIN audit_logs ON orders.user_id = au...
 4055 | 00:02:11.198273 | active | SELECT count(*) FROM sessions WHERE expires_at < NOW();
(2 rows)
lucas [09:34]: PID 4021 has been running for 15 minutes! It is a large join on audit_logs without an index on user_id.
mark [09:35]: Let's kill that query to free up CPU immediately, then create the missing index.
$ psql -h prod-db.amazonaws.com -U postgres -d core_prod -c "SELECT pg_cancel_backend(4021);"
 pg_cancel_backend
-------------------
 t
(1 row)
$ psql -h prod-db.amazonaws.com -U postgres -d core_prod -c "CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);"
CREATE INDEX
lucas [09:40]: CPU utilization dropped back to 7.8% right after index creation. Gateway timeouts resolved.`,
  },
  {
    name: "Linux Systemd Service Restart",
    description: "Systemd unit file failed to start due to corrupted configuration syntax after updates.",
    category: "infrastructure",
    difficulty: "Easy",
    estimatedTime: "1 min",
    logContent: `[2026-07-16T08:12:00Z] SYSTEM: service nginx status failed.
root@node02:~# systemctl status nginx
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: failed (Result: exit-code) since Thu 2026-07-16 08:10:45 UTC; 1min 15s ago
       Docs: man:nginx(8)
    Process: 2844 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=1/FAILURE)

root@node02:~# nginx -t
nginx: [emerg] open() "/etc/nginx/sites-enabled/api.conf" failed (2: No such file or directory) in /etc/nginx/nginx.conf:142
nginx: configuration file /etc/nginx/nginx.conf test failed

root@node02:~# ls -l /etc/nginx/sites-enabled/
total 0
lrwxrwxrwx 1 root root 34 Jul 16 08:09 api.conf -> /etc/nginx/sites-available/api.conf

root@node02:~# ls -l /etc/nginx/sites-available/
total 4
-rw-r--r-- 1 root root 412 Jun 12 12:45 default

root@node02:~# rm /etc/nginx/sites-enabled/api.conf
root@node02:~# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful

root@node02:~# systemctl start nginx
root@node02:~# systemctl status nginx | grep Active
   Active: active (running) since Thu 2026-07-16 08:14:12 UTC; 2s ago`,
  },
];

interface DemoTemplatesProps {
  onSelectTemplate: (content: string) => void;
  disabled?: boolean;
}

export default function DemoTemplates({ onSelectTemplate, disabled = false }: DemoTemplatesProps) {
  const getCategoryIcon = (category: Template["category"]) => {
    switch (category) {
      case "kubernetes":
        return <Layers className="w-4 h-4 text-[#b69cff]" />;
      case "database":
        return <Database className="w-4 h-4 text-[#f4bf63]" />;
      case "docker":
        return <Server className="w-4 h-4 text-[#34d399]" />;
      case "infrastructure":
        return <Terminal className="w-4 h-4 text-[#60a5fa]" />;
      default:
        return <Cpu className="w-4 h-4 text-text-muted" />;
    }
  };

  // Helper to color code category badges
  const getCategoryBadgeStyles = (category: Template["category"]) => {
    switch (category) {
      case "kubernetes":
        return "bg-violet-500/10 text-violet-500 border-violet-500/20";
      case "database":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "docker":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "infrastructure":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  // Helper to color code difficulty indicator
  const getDifficultyColor = (difficulty: Template["difficulty"]) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-400";
      case "Medium":
        return "bg-amber-400";
      case "Hard":
        return "bg-rose-400";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-1 mb-4 select-none">
        <h4 className="text-xs font-bold text-text-muted font-mono uppercase tracking-wider">Interactive Demo Templates</h4>
        <p className="text-xs text-text-muted">
          Click any card to instantly load a realistic incident transcript for testing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.name}
            onClick={() => !disabled && onSelectTemplate(template.logContent)}
            disabled={disabled}
            className={`flex flex-col justify-between w-full text-left p-5 rounded-2xl border border-box-border bg-box-bg/40 backdrop-blur-sm hover:bg-box-bg hover:border-accent-primary/45 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 group ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
          >
            <div className="w-full">
              {/* Category Badge & Icon */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeStyles(template.category)}`}>
                  {getCategoryIcon(template.category)}
                  {template.category}
                </span>
              </div>
              
              <h5 className="text-sm font-bold text-foreground group-hover:text-accent-primary transition-colors duration-200 mb-1.5">
                {template.name}
              </h5>
              
              <p className="text-xs text-text-muted leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* Bottom Metadata row */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-box-border w-full text-[10px] font-mono text-text-muted font-medium">
              <span className="flex items-center gap-1.5 select-none">
                <span className={`w-1.5 h-1.5 rounded-full ${getDifficultyColor(template.difficulty)}`} />
                {template.difficulty}
              </span>
              <span className="text-box-border/80">•</span>
              <span>{template.estimatedTime} read</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
