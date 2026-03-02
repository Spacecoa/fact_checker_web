import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download, Filter } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string | undefined>();
  const [verificationStatus, setVerificationStatus] = useState<string | undefined>();
  const [limit] = useState(20);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "partially_verified":
        return "bg-yellow-100 text-yellow-800";
      case "false":
        return "bg-red-100 text-red-800";
      case "no_evidence":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Fact-Checking</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie todos os relatórios de verificação de fatos</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Verificados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Não Verificados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unverified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Verificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título ou alegação..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            {/* Source Filter */}
            <Select value={source || "all"} onValueChange={(value) => {
              setSource(value === "all" ? undefined : value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma fonte..." />
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
                <SelectValue placeholder="Selecione um status..." />
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
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
          <CardDescription>
            {reportsData?.total || 0} relatórios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : reportsData?.reports && reportsData.reports.length > 0 ? (
            <div className="space-y-4">
              {reportsData.reports.map((report: any) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{report.mainClaim}</p>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline">{report.source}</Badge>
                        <Badge className={getStatusColor(report.verificationStatus)}>
                          {getStatusLabel(report.verificationStatus)}
                        </Badge>
                        {report.isVerified && (
                          <Badge variant="secondary">✓ Verificado</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum relatório encontrado com os filtros aplicados.
            </div>
          )}

          {/* Pagination */}
          {reportsData && reportsData.total > limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
