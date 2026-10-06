import { BrowserRouter, Routes, Route } from "react-router-dom";

import Foot from "./components/Customer/Foot";
import CreateAccount from "./components/Customer/CreateAccount";
import Login from "./components/Customer/Login";
import Home from "./components/Customer/Home";
import AdminProductForm from "./components/Admin/AdminProductForm";
import Fashion from "./components/Customer/Fashion";
import Mobiles from "./components/Customer/Mobiles";
import Electronics from "./components/Customer/Electronics";
import Beauty from "./components/Customer/Beauty";  
import Decor from "./components/Customer/Decor";
import Toys from "./components/Customer/Toys";
import Sports from "./components/Customer/Sports";
import Furniture from "./components/Customer/Furniture";
import Cart from "./components/Customer/Cart";
import Checkout from "./components/Customer/Checkout";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Create Account */}
        <Route
          path="/createaccount"
          element={<CreateAccount />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* AdminPage */}
        <Route
          path="/adminform"
          element={<AdminProductForm/>}/>
          <Route
          path="/fashion"
          element={<Fashion/>}/>

          <Route path="/mobiles" element={<Mobiles />} />
          <Route path="/electronics" element={<Electronics />} />
          <Route path="/beauty" element={<Beauty />} />
          <Route path="/decor" element={<Decor />} />
          <Route path="/toys" element={<Toys />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/furniture" element={<Furniture />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

      </Routes>


    </BrowserRouter>
  );
}

export default App;