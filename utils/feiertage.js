function isFeiertag(date, bundesland) {
    const tag = formatDate(date);
    const year = date.getFullYear();
    const feiertage = window.isFeiertag[`${bundesland}_${year}`] || [];
    return feiertage.includes(tag);
}
