import React from "react";

const NotFound: React.FC = () => ( 
  <div style={{ textAlign: "center", marginTop: "3rem" }}>
    <h1>404</h1>
    <p>Página não encontrada</p>
    <br />
    <span className="text-gray-600">
        A página que você está procurando não existe ou foi movida.
    </span>
    <br />
    <a href="/">Voltar para a página inicial</a>
  </div>
);

export default NotFound;