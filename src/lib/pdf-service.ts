import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction, Family, Member, Certificate } from '@/types/database';

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

export const generateCertificatePDF = (cert: Certificate, member: Member) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const primaryColor = '#0f172a';

    // Border
    doc.setDrawColor('#10b981'); // Green Primary
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);
    doc.setLineWidth(0.2);
    doc.rect(7, 7, 196, 283);

    // Header Branding
    doc.setTextColor(primaryColor);
    doc.setFontSize(26);
    doc.setFont('times', 'bold');
    doc.text('WEST MULAVOOR JUMA MASJID', 105, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('times', 'italic');
    doc.text('Registered Community Management Authority', 105, 48, { align: 'center' });

    doc.setDrawColor('#e2e8f0');
    doc.line(50, 55, 160, 55);

    // Certificate Title
    doc.setFontSize(32);
    doc.setFont('times', 'bold');
    doc.text(`${cert.type.toUpperCase()} CERTIFICATE`, 105, 80, { align: 'center' });

    // Body
    doc.setFontSize(14);
    doc.setFont('times', 'normal');
    doc.text('This is to officially certify that', 105, 110, { align: 'center' });

    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.text(member.name.toUpperCase(), 105, 125, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('times', 'normal');
    doc.text(`is a registered member of this Mahallu under ID: ${member.member_id}`, 105, 140, { align: 'center' });

    // Custom content based on type
    let contentY = 160;
    doc.setFontSize(12);
    if (cert.type === 'Marriage') {
        doc.text('Having observed all community protocols and traditions, the marriage', 105, contentY, { align: 'center' });
        doc.text('has been duly recorded in our official registry.', 105, contentY + 10, { align: 'center' });
    } else if (cert.type === 'Membership') {
        doc.text('The individual is in good standing and is entitled to all', 105, contentY, { align: 'center' });
        doc.text('privileges and responsibilities associated with this community.', 105, contentY + 10, { align: 'center' });
    } else {
        doc.text('This document serves as an official proof and record as requested by the applicant.', 105, contentY, { align: 'center' });
    }

    // Official Details
    doc.setFontSize(11);
    doc.text(`Certificate ID: ${cert.certificate_id}`, 30, 220);
    doc.text(`Issue Date: ${new Date(cert.issue_date).toLocaleDateString()}`, 30, 228);

    // Signatures Area
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('Khatheeb / Imam', 50, 260, { align: 'center' });
    doc.text('Secretary', 160, 260, { align: 'center' });

    doc.setDrawColor(primaryColor);
    doc.line(30, 255, 70, 255);
    doc.line(140, 255, 180, 255);

    // Footer
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor('#94a3b8');
    doc.text('Digital Authenticity Verified - Mahallu Management System', 105, 280, { align: 'center' });

    doc.save(`${cert.type}_Certificate_${member.name.replace(/\s+/g, '_')}.pdf`);
};
