import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction, Family, Member } from '@/types/database';

// Extend jsPDF for autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: any;
    }
}

export const generateReceiptPDF = (transaction: Transaction, family: Family) => {
    const doc = new jsPDF();
    const primaryColor = '#0f172a'; // Mahallu Dark
    const accentColor = '#10b981'; // Mahallu Primary (Green)

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor('#ffffff');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('WEST MULAVOOR JUMA MASJID', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mahallu Management System - Official Receipt', 105, 30, { align: 'center' });

    // Receipt Info Section
    doc.setTextColor(primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', 20, 55);

    doc.setDrawColor('#e2e8f0');
    doc.line(20, 58, 190, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const startY = 68;
    doc.text(`Receipt No: #${transaction.receipt_number || 'TRX-' + transaction.id.slice(0, 8).toUpperCase()}`, 20, startY);
    doc.text(`Date: ${new Date(transaction.transaction_date).toLocaleDateString()}`, 190, startY, { align: 'right' });

    // Payer Info
    doc.text('Paid By:', 20, startY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`${family.house_name}`, 20, startY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${family.family_id}`, 20, startY + 28);
    doc.text(`${family.address}`, 20, startY + 34);

    // Transaction Details Table
    doc.autoTable({
        startY: startY + 50,
        head: [['Category', 'Description', 'Amount']],
        body: [
            [
                transaction.category,
                transaction.category === 'Monthly Subscription'
                    ? `Masappadi for ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(transaction.payment_month || 1) - 1]} ${transaction.payment_year}`
                    : (transaction.notes || 'Contribution to Mahallu fund'),
                `INR ${Number(transaction.amount).toLocaleString()}`
            ]
        ],
        headStyles: { fillColor: primaryColor, textColor: '#ffffff', fontStyle: 'bold' },
        bodyStyles: { textColor: primaryColor },
        columnStyles: {
            2: { halign: 'right', fontStyle: 'bold' }
        },
        theme: 'striped'
    });

    // Total and Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFillColor('#f8fafc');
    doc.rect(130, finalY, 60, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAID:', 135, finalY + 10);
    doc.text(`INR ${Number(transaction.amount).toLocaleString()}`, 185, finalY + 10, { align: 'right' });

    // Signatures
    doc.setFont('helvetica', 'normal');
    doc.text('Secretary / Treasurer', 150, finalY + 40, { align: 'center' });
    doc.line(130, finalY + 35, 170, finalY + 35);

    doc.setFontSize(8);
    doc.setTextColor('#94a3b8');
    doc.text('This is a computer-generated receipt. No signature is required.', 105, 285, { align: 'center' });

    doc.save(`Receipt_${family.house_name}_${transaction.id.slice(0, 5)}.pdf`);
};


