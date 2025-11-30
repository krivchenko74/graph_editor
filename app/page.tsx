import Header from "@/components/Header/Header";
import GraphEditor from "@/components/GraphEditor/GraphEditor";
import StepManager from "@/components/StepManager/StepManager";
import { DebugInfo } from "@/components/DebugInfo";
export default function Home() {
  return (
    <>
      <Header />
      <GraphEditor />
      <StepManager />
    </>
  );
}
