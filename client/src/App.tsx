import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CreateToken from "./pages/CreateToken";
import AirdropList from "./pages/AirdropList";
import CreateAirdrops from "./pages/CreateAirdrops";
import CreateLock from "./pages/CreateLock";
import CreatePresale from "./pages/CreatePresale";
import CreatePrivateSale from "./pages/CreatePrivateSale";
import LaunchList from "./pages/LaunchList";
import LockedJettons from "./pages/LockedJettons";
import PrivateSales from "./pages/PrivateSales";
import TokenLockDetails from "./pages/TokenLockDetails";
import AirdropDetails from "./pages/AirdropDetails";
import ViewToken from "./pages/ViewToken";
import { useTonAddress } from "@tonconnect/ui-react";

import "react-toastify/dist/ReactToastify.css";
import LaunchpadDetails from "./pages/LaunchpadDetails";
import PrivateLaunchpadDetails from "./pages/PrivateLaunchpadDetails";
import AdminList from "./pages/AdminList";
import AutolistDetails from "./pages/AutolistDetails";
import { isAdmin } from "./assets/admin";
import MyTokens from "./pages/MyTokens";

function App() {
  const wallet = useTonAddress();
  return (
    <>
      <ToastContainer />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          {/*********** TOKEN ************/}
          <Route path="/token/create" element={<CreateToken />} />
          <Route path="/token/my-tokens" element={<MyTokens />} />
          <Route path="/token/:address" element={<ViewToken />} />
          {/*********** SAFE lAUNCH ************/}
          <Route path="/safe-launch/create" element={<CreatePresale />} />
          <Route
            path="/safe-launch/private/create"
            element={<CreatePrivateSale />}
          />
          <Route path="/safe-launch" element={<LaunchList />} />
          <Route path="/safe-launch/:id" element={<LaunchpadDetails />} />
          <Route
            path="/safe-launch/private/:id"
            element={<PrivateLaunchpadDetails />}
          />
          <Route path="/safe-launch/private" element={<PrivateSales />} />
          {/*********** SAFE LOCK ************/}
          <Route path="/safe-lock/create" element={<CreateLock />} />
          <Route path="/safe-lock" element={<LockedJettons />} />
          <Route
            path="/safe-lock/:lockAddress"
            element={<TokenLockDetails />}
          />
          {/*********** SAFE DROP ************/}
          <Route path="/safe-drop/create" element={<CreateAirdrops />} />
          <Route path="/safe-drop" element={<AirdropList />} />
          <Route path="/safe-drop/:id" element={<AirdropDetails />} />
          {wallet && isAdmin(wallet) && (
            <>
              <Route path="/admin/autolist" element={<AdminList />} />
              <Route path="/admin/autolist/:id" element={<AutolistDetails />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
