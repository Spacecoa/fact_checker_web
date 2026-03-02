import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calendar, Newspaper, TrendingUp, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardBlog() {
  const [location, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string | undefined>();
  const [verificationStatus, setVerificationStatus] = useState<string | undefined>();
  const [limit] = useState(12);

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = trpc.factChecker.list.useQuery({
    page,
    limit,
    search: search || undefined,
    source: source || undefined,
    verificationStatus: verificationStatus as any,
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = trpc.factChecker.stats.useQuery();

  // Get unique sources from stats
  const sources = useMemo(() => {
    if (!stats?.bySource) return [];
    return Object.keys(stats.bySource);
  }, [stats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "false":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "partially_verified":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Newspaper className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "badge-verified";
      case "partially_verified":
        return "badge-partial";
      case "false":
        return "badge-false";
      default:
        return "badge-unverified";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      verified: "Verificado",
      partially_verified: "Parcialmente Verificado",
      false: "Falso",
      no_evidence: "Sem Evidência",
      unverified: "Não Verificado",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border py-8 md:py-12">
        <div className="container max-w-6xl mx-auto">
          <div className="space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold">Fact-Checking</h1>
            <p className="text-lg text-muted-foreground">
              Explore relatórios detalhados de verificação de fatos políticos brasileiros
            </p>
          </div>

          {/* Statistics */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Relatórios</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Verificados</p>
                <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Não Verificados</p>
                <p className="text-3xl font-bold text-blue-600">{stats.unverified}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taxa de Verificação</p>
                <p className="text-3xl font-bold">
                  {stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border py-6">
        <div className="container max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notícias..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Source Filter */}
              <Select value={source || "all"} onValueChange={(value) => {
                setSource(value === "all" ? undefined : value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as fontes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  {sources.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={verificationStatus || "all"} onValueChange={(value) => {
                setVerificationStatus(value === "all" ? undefined : value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="unverified">Não Verificado</SelectItem>
                  <SelectItem value="verified">Verificado</SelectItem>
                  <SelectItem value="partially_verified">Parcialmente Verificado</SelectItem>
                  <SelectItem value="false">Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(search || source || verificationStatus) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSource(undefined);
                  setVerificationStatus(undefined);
                  setPage(1);
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="py-12">
        <div className="container max-w-6xl mx-auto">
          {reportsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportsData?.reports && reportsData.reports.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {reportsData.reports.map((report: any) => (
                  <article
                    key={report.id}
                    className="card-report p-6 cursor-pointer group"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(report.verificationStatus)}
                          <Badge className={`${getStatusColor(report.verificationStatus)} text-xs`}>
                            {getStatusLabel(report.verificationStatus)}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {report.title}
                        </h3>
                      </div>
                    </div>

                    {/* Claim */}
                    <p className="text-sm text-muted-foreground italic mb-4 line-clamp-2">
                      "{report.mainClaim}"
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4" />
                        <span>{report.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {reportsData && reportsData.total > limit && (
                <div className="flex justify-center gap-4 items-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {Math.ceil(reportsData.total / limit)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(reportsData.total / limit)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhum relatório encontrado com os filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
