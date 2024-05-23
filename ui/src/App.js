import { EventsFeed } from "./components/event-feed";
import SwapForm from "./components/swap-form";

function App() {
  return (
    <div className="h-screen w-screen bg-black text-neutral-100">
      <header className="flex h-20 w-full flex-row-reverse items-center bg-neutral-900 px-8">
        <w3m-button />
      </header>
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center">
        <SwapForm />
        <footer className="flex justify-center bg-black">
          <EventsFeed />
        </footer>
      </div>
    </div>
  );
}

export default App;
