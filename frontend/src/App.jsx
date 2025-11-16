import React, {useState} from "react";
import Upload from "./components/Upload";
import Products from "./components/Products";
import Webhooks from "./components/Webhooks";

export default function App(){
  const [view, setView] = useState("upload");
  return (
    <div style={{padding:20, fontFamily:'sans-serif'}}>
      <header style={{display:'flex', gap:10, marginBottom:20}}>
        <button onClick={()=>setView('upload')}>Upload CSV</button>
        <button onClick={()=>setView('products')}>Products</button>
        <button onClick={()=>setView('webhooks')}>Webhooks</button>
      </header>
      <main>
        {view==='upload' && <Upload />}
        {view==='products' && <Products />}
        {view==='webhooks' && <Webhooks />}
      </main>
    </div>
  );
}
