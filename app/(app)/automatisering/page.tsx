import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AutomatiseringFlowBuilder } from "@/components/automatisering/AutomatiseringFlowBuilder";

export default function AutomatiseringPage() {
  return (
    <PageWrapper>
      <Header title="Automatisering" />
      <AutomatiseringFlowBuilder />
    </PageWrapper>
  );
}
