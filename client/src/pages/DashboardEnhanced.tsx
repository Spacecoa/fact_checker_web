import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Download, RefreshCw, Search } from "lucide-react";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  verified: "#10b981",
  partially_verified: "#f59e0b",
  false: "#ef4444",
  no_evidence: "#6b7280",
  unverified: "#3b82f6",
};

export default function DashboardEnhanced() {
  const [location, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Queries
  const reportsQuery = trpc.reports.list.useQuery({
    page,
    limit,
    search: search || undefined,
    source: sourceFilter || undefined,
    status: (statusFilter as any) || undefined,
  });

  const statsQuery = trpc.reports.stats.useQuery();
  const sourcesQuery = trpc.reports.sources.useQuery();
  const jobStatusQuery = trpc.reports.jobStatus.useQuery();

  // Mutations
  const collectNewsMutation = trpc.reports.collectNews.useMutation();
  const verifyMutation = trpc.reports.verifyUnverified.useMutation();
  const triggerJobMutation = trpc.reports.triggerJob.useMutation();

  const stats = statsQuery.data;
  const sources = sourcesQuery.data || [];
  const jobStatus = jobStatusQuery.data;
  const { reports = [], total = 0, pages = 1 } = reportsQuery.data || {};

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Verificado", value: stats.byStatus.verified, fill: STATUS_COLORS.verified },
      { name: "Parcialmente", value: stats.byStatus.partially_verified, fill: STATUS_COLORS.partially_verified },
      { name: "Falso", value: stats.byStatus.false, fill: STATUS_COLORS.false },
      { name: "Sem Evidência", value: stats.byStatus.no_evidence, fill: STATUS_COLORS.no_evidence },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const sourceChartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.bySource)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [stats]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      verified: "bg-green-100 text-green-800",
      partially_verified: "bg-yellow-100 text-yellow-800",
      false: "bg-red-100 text-red-800",
      no_evidence: "bg-gray-100 text-gray-800",
      unverified: "bg-blue-100 text-blue-800",
    };

    const labels: Record<string, string> = {
      verified: "✅ Verificado",
      partially_verified: "⚠️ Parcial",
      false: "❌ Falso",
      no_evidence: "❓ Sem Evidência",
      unverified: "⏳ Não Verificado",
    };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.unverified}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Fact-Checking</h1>
          <p className="text-muted-foreground mt-1">Monitore e gerencie relatórios de verificação de fatos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => collectNewsMutation.mutate()}
            disabled={collectNewsMutation.isPending}
            variant="outline"
          >
            {collectNewsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Coletando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Coletar Notícias
              </>
            )}
          </Button>
          <Button
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            variant="outline"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Relatórios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Total de Relatórios</div>
            <div className="text-3xl font-bold mt-2">{stats.total}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Verificados</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats.verified}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Não Verificados</div>
            <div className="text-3xl font-bold mt-2 text-blue-600">{stats.unverified}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Taxa de Verificação</div>
            <div className="text-3xl font-bold mt-2">
              {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusChartData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Status de Verificação</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {sourceChartData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Relatórios por Fonte</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros e Busca</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar relatórios..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          <Select value={sourceFilter || "all"} onValueChange={(value) => {
            setSourceFilter(value === "all" ? "" : value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por fonte..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter || "all"} onValueChange={(value) => {
            setStatusFilter(value === "all" ? "" : (value as any));
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="unverified">Não Verificado</SelectItem>
              <SelectItem value="verified">Verificado</SelectItem>
              <SelectItem value="partially_verified">Parcialmente Verificado</SelectItem>
              <SelectItem value="false">Falso</SelectItem>
              <SelectItem value="no_evidence">Sem Evidência</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => reportsQuery.refetch()}
            disabled={reportsQuery.isLoading}
            variant="outline"
            className="w-full"
          >
            {reportsQuery.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Atualizar"
            )}
          </Button>
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Relatórios</h2>

        {reportsQuery.isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum relatório encontrado</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border rounded-lg hover:bg-subtle cursor-pointer transition-colors"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{report.mainClaim}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs bg-subtle px-2 py-1 rounded">
                          {report.source}
                        </span>
                        {getStatusBadge(report.verificationStatus || "unverified")}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  variant="outline"
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Página {page} de {pages}
                  </span>
                </div>
                <Button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  variant="outline"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Job Status */}
      {jobStatus && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Status dos Agendadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(jobStatus).map(([jobName, job]: any) => (
              <div key={jobName} className="p-4 border rounded-lg">
                <div className="font-medium text-foreground capitalize">{jobName}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  <div>Status: {job.enabled ? "✅ Ativo" : "❌ Inativo"}</div>
                  <div>Intervalo: {Math.round(job.interval / 1000 / 60)} minutos</div>
                  <div>Próxima execução: {new Date(job.nextRun).toLocaleTimeString("pt-BR")}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
