import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const CTASection = memo(function CTASection() {
  return (
    <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <Card className="max-w-3xl mx-auto bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0">
        <CardHeader className="text-center p-6 sm:p-8 pb-2 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-4 text-white">
            Pronto para começar?
          </CardTitle>
          <CardDescription className="text-white/90 text-sm sm:text-base">
            Comece seu teste grátis de 14 dias hoje mesmo. Sem cartão de crédito.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6 sm:p-8 pt-2 sm:pt-4">
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8">
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </section>
  );
});

export default CTASection;
