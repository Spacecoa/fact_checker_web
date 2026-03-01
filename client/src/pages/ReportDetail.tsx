import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Download, Share2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface ReportDetailProps {
  id: string;
}

export default function ReportDetail({ id }: ReportDetailProps) {
  const [, navigate] = useLocation();
  const reportId = parseInt(id, 10);

  const { data: report, isLoading } = trpc.factChecker.getById.useQuery(
    { id: reportId },
    { enabled: !isNaN(reportId) }
  );

  const getStatusColor = (status: string | null | undefined) => {
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

  const getStatusLabel = (status: string | null | undefined) => {
    const labels: Record<string, string> = {
      verified: "Verificado",
      partially_verified: "Parcialmente Verificado",
      false: "Falso",
      no_evidence: "Sem Evidência",
      unverified: "Não Verificado",
    };
    return (status && labels[status]) || status || "Desconhecido";
  };

  const handleExport = async (format: "json" | "markdown" | "csv") => {
    if (!report) return;

    try {
      let content = "";
      let filename = `report-${report.id}`;
      let mimeType = "text/plain";

      if (format === "json") {
        content = JSON.stringify(report, null, 2);
        filename += ".json";
        mimeType = "application/json";
      } else if (format === "markdown") {
        content = `# ${report.title}\n\n`;
        content += `**Fonte:** ${report.source}\n`;
        content += `**Data:** ${new Date(report.createdAt).toLocaleDateString("pt-BR")}\n\n`;
        content += `## Alegação Principal\n${report.mainClaim}\n\n`;
        content += `## Resumo\n${report.summary || "N/A"}\n\n`;
        content += `## Análise do Especialista\n${report.llmAnalysis || "N/A"}\n\n`;
        if (report.keywords && Array.isArray(report.keywords)) {
          content += `## Palavras-chave\n${report.keywords.join(", ")}\n\n`;
        }
        content += `## Status de Verificação\n${getStatusLabel(report.verificationStatus)}\n`;
        filename += ".md";
        mimeType = "text/markdown";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Relatório exportado como ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Relatório não encontrado</p>
        <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{report.title}</h1>
          <p className="text-gray-600 mt-1">
          {new Date(report.createdAt).toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alegação Principal */}
          <Card>
            <CardHeader>
              <CardTitle>Alegação Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{report.mainClaim}</p>
            </CardContent>
          </Card>

          {/* Resumo */}
          <>
            {report.summary && typeof report.summary === 'string' && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Notícia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{report.summary}</p>
                </CardContent>
              </Card>
            )}
          </>

          {/* Análise do Especialista */}
          <>
            {report.llmAnalysis && typeof report.llmAnalysis === 'string' && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise do Especialista (LLM)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.llmAnalysis}</p>
                </CardContent>
              </Card>
            )}
          </>

          {/* Palavras-chave */}
          {report.keywords && Array.isArray(report.keywords) && report.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Palavras-chave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.keywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados de Fact-Check */}
          {report.isVerified && report.factCheckResults && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Fact-Check (Google API)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(report.factCheckResults) && (report.factCheckResults as any[]).length > 0 ? (
                    (report.factCheckResults as any[]).map((result: any, idx: number): React.ReactNode => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="font-semibold">{result.claim || "Alegação"}</p>
                        {result.claimReview && Array.isArray(result.claimReview) && (
                          <div className="mt-2 space-y-2">
                                            {result.claimReview.map((review: any, ridx: number): React.ReactNode => (
                              <div key={ridx} className="text-sm">
                                <p className="font-medium">{review.publisher?.name || "Fonte desconhecida"}</p>
                                <p className="text-gray-600">Avaliação: {review.textualRating}</p>
                                {review.url && (
                                  <a
                                    href={review.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Ver verificação completa →
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Nenhum resultado de fact-check disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Verificação</p>
                <Badge className={getStatusColor(report.verificationStatus || "unverified")}>
                  {getStatusLabel(report.verificationStatus || "unverified")}
                </Badge>
              </div>
              {report.isVerified && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Resultado</p>
                  <Badge variant="secondary">✓ Verificado</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Fonte</p>
                <p className="font-medium">{report.source}</p>
              </div>
              <div>
                <p className="text-gray-600">ID do Relatório</p>
                <p className="font-mono text-xs">{report.reportId}</p>
              </div>
              {report.newsLink && (
                <div>
                  <p className="text-gray-600">Link da Notícia</p>
                  <a
                    href={report.newsLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    Acessar →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Card */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleExport("json")}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleExport("markdown")}
              >
                <Download className="h-4 w-4 mr-2" />
                Markdown
              </Button>
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card>
            <CardHeader>
              <CardTitle>Compartilhar</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const url = `${window.location.origin}/reports/${report.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado!");
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
