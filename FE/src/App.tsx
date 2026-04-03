import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes";

import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/ui/Toast";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
