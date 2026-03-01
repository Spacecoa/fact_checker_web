import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, TrendingUp, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Fact Check Brasil</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
                <span className="text-sm text-muted-foreground">
                  Olá, {user?.name?.split(" ")[0]}
                </span>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 border-b border-border">
        <div className="container max-w-3xl mx-auto text-center space-y-8 animate-fade-in-up">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Verificação de Fatos em Tempo Real
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Uma plataforma moderna e transparente para verificar notícias políticas brasileiras. Análise profunda, dados confiáveis e integração com Telegram.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                Ir para Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="lg" asChild className="gap-2">
                <a href={getLoginUrl()}>
                  Começar Agora
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Recursos Principais</h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para verificar fatos com confiança
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-report p-8 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Verificação Profunda</h3>
              <p className="text-muted-foreground leading-relaxed">
                Análise detalhada de alegações usando inteligência artificial e APIs de fact-checking confiáveis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-report p-8 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Dashboard em Tempo Real</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize estatísticas, tendências e histórico completo de verificações em um único lugar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-report p-8 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Integração Telegram</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receba notificações automáticas de novos relatórios e acesse informações diretamente no Telegram.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32 border-t border-b border-border bg-subtle">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold">1.200+</div>
              <p className="text-muted-foreground">Notícias Verificadas</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">98%</div>
              <p className="text-muted-foreground">Taxa de Precisão</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">15+</div>
              <p className="text-muted-foreground">Fontes de Notícias</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">24/7</div>
              <p className="text-muted-foreground">Monitoramento Contínuo</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Como Funciona</h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                  1
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Coleta de Notícias</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nossas fontes RSS coletam notícias políticas de diversos portais brasileiros em tempo real.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                  2
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Análise com IA</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Modelos de linguagem avançados analisam cada alegação e identificam pontos-chave para verificação.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                  3
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Fact-Check Profissional</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Verificação com Google Fact Check API e outras fontes confiáveis de fact-checking.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                  4
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Publicação e Notificação</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Resultados são publicados no dashboard e notificações são enviadas aos inscritos no Telegram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-border">
        <div className="container max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Pronto para Começar?</h2>
            <p className="text-lg text-muted-foreground">
              Acesse o dashboard e explore relatórios de fact-checking detalhados e confiáveis.
            </p>
          </div>

          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              Ir para Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="lg" asChild className="gap-2">
              <a href={getLoginUrl()}>
                Entrar Agora
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-subtle">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Fact Check Brasil</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Verificação de fatos em tempo real para notícias políticas brasileiras.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Telegram Bot</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2026 Fact Check Brasil. Todos os direitos reservados.</p>
            <p>Desenvolvido com transparência e precisão.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
