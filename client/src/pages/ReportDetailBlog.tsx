import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Download, Share2, Calendar, Newspaper, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface ReportDetailProps {
  id: string;
}

export default function ReportDetailBlog({ id }: ReportDetailProps) {
  const [, navigate] = useLocation();
  const reportId = parseInt(id, 10);

  const { data: report, isLoading } = trpc.factChecker.getById.useQuery(
    { id: reportId },
    { enabled: !isNaN(reportId) }
  );

  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "false":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "partially_verified":
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      default:
        return <Newspaper className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
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

  const handleExport = async (format: "json" | "markdown") => {
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
        content += `**Data:** ${new Date(report.createdAt).toLocaleDateString("pt-BR")}\n`;
        content += `**Status:** ${getStatusLabel(report.verificationStatus)}\n\n`;
        content += `## Alegação Principal\n${report.mainClaim}\n\n`;
        if (report.summary) {
          content += `## Resumo\n${report.summary}\n\n`;
        }
        if (report.llmAnalysis) {
          content += `## Análise do Especialista\n${report.llmAnalysis}\n\n`;
        }
        if (report.keywords && Array.isArray(report.keywords)) {
          content += `## Palavras-chave\n${report.keywords.join(", ")}\n`;
        }
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Relatório não encontrado</p>
        <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border py-8">
        <div className="container max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(report.verificationStatus)}
              <Badge className={`${getStatusColor(report.verificationStatus)}`}>
                {getStatusLabel(report.verificationStatus)}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span>{report.source}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(report.createdAt).toLocaleDateString("pt-BR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12">
        <div className="container max-w-3xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Article */}
          <div className="lg:col-span-2 space-y-8">
            {/* Alegação Principal */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Alegação Principal</h2>
              <p className="text-lg leading-relaxed italic text-muted-foreground border-l-4 border-primary pl-4">
                "{report.mainClaim}"
              </p>
            </section>

            {/* Resumo */}
            {/* @ts-ignore */}
            {report.summary && typeof report.summary === "string" ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Resumo da Notícia</h2>
                <p className="leading-relaxed text-foreground">{report.summary}</p>
              </section>
            ) : null}

            {/* Análise */}
            {/* @ts-ignore */}
            {report.llmAnalysis && typeof report.llmAnalysis === "string" ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Análise do Especialista</h2>
                <div className="bg-subtle rounded-lg p-6 border border-border">
                  <p className="leading-relaxed whitespace-pre-wrap text-foreground">
                    {report.llmAnalysis}
                  </p>
                </div>
              </section>
            ) : null}

            {/* Palavras-chave */}
            {report.keywords && Array.isArray(report.keywords) && report.keywords.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Palavras-chave</h2>
                <div className="flex flex-wrap gap-2">
                  {(report.keywords as string[]).map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Fact-Check Results */}
            {report.isVerified && report.factCheckResults && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Resultados de Fact-Check</h2>
                <div className="space-y-4">
                  {Array.isArray(report.factCheckResults) && (report.factCheckResults as any[]).length > 0 ? (
                    (report.factCheckResults as any[]).map((result: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                        <p className="font-semibold mb-2">{result.claim || "Alegação"}</p>
                        {result.claimReview && Array.isArray(result.claimReview) && (
                          <div className="space-y-3">
                            {(result.claimReview as any[]).map((review: any, ridx: number) => (
                              <div key={ridx} className="text-sm bg-subtle rounded p-3">
                                <p className="font-medium">{review.publisher?.name || "Fonte desconhecida"}</p>
                                <p className="text-muted-foreground mt-1">Avaliação: {review.textualRating}</p>
                                {review.url && (
                                  <a
                                    href={review.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline mt-2 inline-block"
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
                    <p className="text-muted-foreground">Nenhum resultado de fact-check disponível</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Export */}
            <div className="border border-border rounded-lg p-6 space-y-3">
              <h3 className="font-semibold">Exportar Relatório</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleExport("json")}
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleExport("markdown")}
              >
                <Download className="h-4 w-4" />
                Markdown
              </Button>
            </div>

            {/* Share */}
            <div className="border border-border rounded-lg p-6 space-y-3">
              <h3 className="font-semibold">Compartilhar</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const url = `${window.location.origin}/reports/${report.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado!");
                }}
              >
                <Share2 className="h-4 w-4" />
                Copiar Link
              </Button>
            </div>

            {/* Info */}
            <div className="border border-border rounded-lg p-6 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Fonte</p>
                <p className="font-medium">{report.source}</p>
              </div>
              {report.newsLink && (
                <div>
                  <p className="text-muted-foreground mb-1">Link da Notícia</p>
                  <a
                    href={report.newsLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    Acessar notícia →
                  </a>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">ID do Relatório</p>
                <p className="font-mono text-xs">{report.reportId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
