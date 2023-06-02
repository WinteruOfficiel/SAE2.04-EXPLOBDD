export default function formatDateFrench(date: Date) {
    const mois = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const jour = date.getDate();
    const moisIndex = date.getMonth();
    const annee = date.getFullYear();

    const moisFrench = mois[moisIndex];

    return `${jour} ${moisFrench} ${annee}`;
}