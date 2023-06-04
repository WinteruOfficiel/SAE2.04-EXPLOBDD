"use client";

import dynamic from 'next/dynamic';
import React from 'react';



export default async function Home() {

  const AnalyseAccueil = React.useMemo(() => dynamic(
    () => import('../../components/AnalyseAccueil'),
    {
      loading: () => <p>Chargement...</p>,
      ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
    }
  ), [])

  return <>

    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flexDirection: 'column' }}>
      <h1>Bienvenue sur ma SAE204 !</h1>
      <AnalyseAccueil />
    </div>
  </>

}
