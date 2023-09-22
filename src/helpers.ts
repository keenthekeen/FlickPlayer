export function colorByFolderName(name: string) {
    const colorMap = {
        '1st year': '#00BCD4',
        '2nd year': '#FF9800',
        '3rd year': '#795548',
        '4th year': '#9C27B0',
        '5th year': '#4CAF50',
        '6th year': '#E91E63',
        'NLE1': '#607D8B',
        'NLE2': '#FDD835'
    };
    return colorMap[name] || 'gray';
}
