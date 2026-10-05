import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Pointage, CahierEntry, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  /**
   * Exporte et télécharge la liste d'émargement (Pointages / Prises et Fins de service)
   */
  async exportEmargementsPdf(pointages: Pointage[], options?: { dateFilter?: string; uniteFilter?: string }): Promise<void> {
    const logo = await this.loadAsecnaLogo().catch(() => null);
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const dateFormatted = this.formatDate(now);
    const timeFormatted = this.formatTime(now);

    // Calcul des statistiques
    const totalPointages = pointages.length;
    const prisesDeService = pointages.filter(p => p.typePointage === 'PRISE_DE_SERVICE' || (p as any).type === 'ENTREE').length;
    const finsDeService = pointages.filter(p => p.typePointage === 'FIN_DE_SERVICE' || (p as any).type === 'SORTIE').length;

    // --- EN-TÊTE DU DOCUMENT ---
    this.drawAsecnaLogo(doc, logo, 14, 2, 20, 20);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.line(14, 24, 283, 24);

    doc.setTextColor(11, 60, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ASECNA — AGENCE POUR LA SÉCURITÉ DE LA NAVIGATION AÉRIENNE', 40, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SYSTÈME DE POINTAGE ÉLECTRONIQUE ASECPOINT • DOCUMENT OFFICIEL DE CONTRÔLE', 40, 18);

    // Date de génération (en haut à droite)
    doc.setFontSize(8);
    doc.text(`Édité le : ${dateFormatted} à ${timeFormatted}`, 283, 15, { align: 'right' });

    // --- TITRE DU DOCUMENT & FILTRES ---
    doc.setTextColor(11, 60, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("LISTE OFFICIELLE D'ÉMARGEMENT DU PERSONNEL", 14, 34);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let sousTitre = 'Registre exhaustif des prises et fins de service horodatées électroniquement.';
    if (options?.dateFilter) {
      sousTitre += ` | Période / Date : ${options.dateFilter}`;
    }
    if (options?.uniteFilter) {
      sousTitre += ` | Unité : ${options.uniteFilter}`;
    }
    doc.text(sousTitre, 14, 40);

    // --- BLOC DE SYNTHÈSE STATISTIQUE ---
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, 44, 269, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    doc.text(`Total Émargements : ${totalPointages}`, 20, 52);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`Prises de service : ${prisesDeService}`, 100, 52);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`Fins de service : ${finsDeService}`, 180, 52);
    doc.setTextColor(100, 116, 139);
    doc.text(`Statut : CERTIFIÉ CONFORME`, 240, 52);

    // --- TABLEAU DES ÉMARGEMENTS ---
    const tableData = pointages.map((p, index) => {
      const rawDate = p.horodatage || (p as any).timestamp;
      const dateEvt = new Date(rawDate);
      const formattedDate = isNaN(dateEvt.getTime()) ? (rawDate || '') : `${this.formatDate(dateEvt)} ${this.formatTime(dateEvt)}`;
      const rawType = p.typePointage || ((p as any).type === 'ENTREE' ? 'PRISE_DE_SERVICE' : 'FIN_DE_SERVICE');
      const typeLabel = rawType === 'PRISE_DE_SERVICE' ? 'PRISE DE SERVICE' : 
                        rawType === 'FIN_DE_SERVICE' ? 'FIN DE SERVICE' : rawType;
      const agentNom = p.user ? `${p.user.nom || ''} ${p.user.prenom || ''}`.trim() : 'N/A';
      const matricule = p.user?.matricule || 'N/A';
      const fonction = p.user?.fonction || 'Agent Opérationnel';
      const unite = p.user?.uniteNom || (p.user as any)?.unite?.nom || 'Générale';

      return [
        (index + 1).toString(),
        formattedDate,
        matricule,
        agentNom,
        fonction,
        unite,
        typeLabel
      ];
    });

    autoTable(doc, {
      startY: 61,
      head: [['N°', 'Horodatage', 'Matricule', 'Nom & Prénom', 'Fonction', 'Unité', 'Type de Pointage']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 60, 112],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 36, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        3: { halign: 'left', cellWidth: 50 },
        4: { halign: 'left', cellWidth: 42 },
        5: { halign: 'left', cellWidth: 35 },
        6: { halign: 'center', cellWidth: 38, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'PRISE DE SERVICE') {
            data.cell.styles.textColor = [4, 120, 87]; // emerald-700
          } else if (data.cell.raw === 'FIN DE SERVICE') {
            data.cell.styles.textColor = [190, 18, 60]; // rose-700
          }
        }
      },
      didDrawPage: (data) => {
        // Pied de page sur chaque page
        const pageCount = doc.getNumberOfPages();
        const pageCurrent = (doc as any).internal.getCurrentPageInfo().pageNumber;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);

        // Ligne de séparation
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 198, 283, 198);

        doc.text('ASECNA - Système ASECPoint de Pointage et Émargement Automatisé • Document strictement confidentiel', 14, 203);
        doc.text(`Page ${pageCurrent} sur ${pageCount}`, 283, 203, { align: 'right' });
      },
      margin: { top: 61, bottom: 25, left: 14, right: 14 }
    });

    // --- ZONE DE SIGNATURE ET VISA (sur la dernière page) ---
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    const signatureY = finalY > 165 ? 170 : Math.max(finalY + 8, 155);

    if (finalY > 165) {
      doc.addPage();
      this.drawSignaturesSection(doc, 25);
    } else {
      this.drawSignaturesSection(doc, signatureY);
    }

    // Téléchargement du fichier
    const dateSlug = now.toISOString().split('T')[0];
    doc.save(`liste_emargement_asecna_${dateSlug}.pdf`);
  }

  /**
   * Exporte et télécharge le Cahier de Marche Opérationnel (Journal de bord)
   */
  async exportCahierDeMarchePdf(entries: CahierEntry[], uniteNom?: string): Promise<void> {
    const logo = await this.loadAsecnaLogo().catch(() => null);
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const dateFormatted = this.formatDate(now);
    const timeFormatted = this.formatTime(now);

    // --- EN-TÊTE DU DOCUMENT ---
    this.drawAsecnaLogo(doc, logo, 14, 2, 20, 20);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.line(14, 24, 283, 24);

    doc.setTextColor(11, 60, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ASECNA — AGENCE POUR LA SÉCURITÉ DE LA NAVIGATION AÉRIENNE', 40, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('JOURNAL OPÉRATIONNEL DE BORD • CAHIER DE MARCHE ÉLECTRONIQUE', 40, 18);

    doc.setFontSize(8);
    doc.text(`Édité le : ${dateFormatted} à ${timeFormatted}`, 283, 15, { align: 'right' });

    // --- TITRE DU DOCUMENT ---
    doc.setTextColor(11, 60, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('REGISTRE DU CAHIER DE MARCHE OPÉRATIONNEL', 14, 34);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const filtreTexte = uniteNom ? `Unité : ${uniteNom}` : 'Toutes les Unités Opérationnelles';
    doc.text(`Journal des événements de quart, consignes, incidents et opérations techniques • ${filtreTexte}`, 14, 40);

    // --- SYNTHÈSE DES ENTRÉES ---
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 44, 269, 13, 2, 2, 'F');

    const total = entries.length;
    const releves = entries.filter(e => e.categorie === 'RELÈVE_DE_QUART').length;
    const incidents = entries.filter(e => e.categorie === 'INCIDENT').length;
    const consignes = entries.filter(e => e.categorie === 'CONSIGNE').length;
    const critiques = entries.filter(e => e.degreUrgence === 'CRITIQUE' || e.degreUrgence === 'URGENT').length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Événements : ${total}`, 20, 52);
    doc.setTextColor(2, 132, 199);
    doc.text(`Relèves de quart : ${releves}`, 80, 52);
    doc.setTextColor(124, 58, 237);
    doc.text(`Consignes : ${consignes}`, 140, 52);
    doc.setTextColor(225, 29, 72);
    doc.text(`Incidents : ${incidents}`, 190, 52);
    doc.setTextColor(180, 83, 9);
    doc.text(`Urgents/Critiques : ${critiques}`, 240, 52);

    // --- TABLEAU DES ENTRÉES DU CAHIER ---
    const photosByEntry = entries.map(e => this.parsePhotos(e.photos));
    const tableData = entries.map((e, index) => {
      const dateEvt = new Date(e.horodatageEvenement);
      const formattedDate = isNaN(dateEvt.getTime()) ? e.horodatageEvenement : `${this.formatDate(dateEvt)} ${this.formatTime(dateEvt)}`;
      const unite = e.unite?.nom || 'Unité Générale';
      const redacteur = e.redacteur ? `${e.redacteur.prenom || ''} ${e.redacteur.nom || ''} (${e.redacteur.matricule || ''})`.trim() : 'N/A';
      const contenuComplet = `${e.titre}\n\n${this.getVisibleContent(e.contenu)}`;

      return [
        (index + 1).toString(),
        formattedDate,
        e.categorie,
        e.degreUrgence,
        unite,
        contenuComplet,
        redacteur
      ];
    });

    autoTable(doc, {
      startY: 61,
      head: [['N°', 'Horodatage', 'Catégorie', 'Urgence', 'Unité', 'Titre & Observations détaillées', 'Rédacteur']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 60, 112],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        4: { halign: 'left', cellWidth: 32 },
        5: { halign: 'left', cellWidth: 95 },
        6: { halign: 'left', cellWidth: 44 }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 3) {
            const urg = data.cell.raw;
            if (urg === 'CRITIQUE') data.cell.styles.textColor = [225, 29, 72];
            else if (urg === 'URGENT') data.cell.styles.textColor = [217, 119, 6];
            else if (urg === 'INFO') data.cell.styles.textColor = [2, 132, 199];
          }
          if (data.column.index === 5) {
            const photos = photosByEntry[data.row.index] || [];
            const photoRows = Math.ceil(photos.length / 3);
            if (photoRows > 0) {
              data.cell.styles.minCellHeight = data.cell.text.length * 7.5 * 0.3528 + photoRows * 20 + 6;
            }
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 5) return;
        const photos = photosByEntry[data.row.index] || [];
        const photoRows = Math.ceil(photos.length / 3);
        const imagesStartY = data.cell.y + data.cell.height - photoRows * 20 - 2;

        photos.forEach((photo, index) => {
          try {
            const properties = doc.getImageProperties(photo);
            const scale = Math.min(28 / properties.width, 18 / properties.height);
            const width = properties.width * scale;
            const height = properties.height * scale;
            const x = data.cell.x + 2 + (index % 3) * 30 + (28 - width) / 2;
            const y = imagesStartY + Math.floor(index / 3) * 20 + (18 - height) / 2;
            doc.addImage(photo, properties.fileType, x, y, width, height);
          } catch (_) {}
        });
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        const pageCurrent = (doc as any).internal.getCurrentPageInfo().pageNumber;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, 198, 283, 198);

        doc.text('ASECNA - Cahier de Marche Électronique ASECPoint • Document d’exploitation et de traçabilité opérationnelle', 14, 203);
        doc.text(`Page ${pageCurrent} sur ${pageCount}`, 283, 203, { align: 'right' });
      },
      margin: { top: 61, bottom: 25, left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    const signatureY = finalY > 165 ? 170 : Math.max(finalY + 8, 155);

    if (finalY > 165) {
      doc.addPage();
      this.drawSignaturesSection(doc, 25);
    } else {
      this.drawSignaturesSection(doc, signatureY);
    }

    const dateSlug = now.toISOString().split('T')[0];
    const nomUniteSlug = uniteNom ? `_${uniteNom.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
    doc.save(`cahier_de_marche_asecna${nomUniteSlug}_${dateSlug}.pdf`);
  }

  /**
   * Exporte la liste des agents (Roster du personnel)
   */
  async exportAgentsListPdf(users: User[]): Promise<void> {
    const logo = await this.loadAsecnaLogo().catch(() => null);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const dateFormatted = this.formatDate(now);

    // En-tête
    this.drawAsecnaLogo(doc, logo, 14, 2, 19, 19);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.line(14, 23, 196, 23);

    doc.setTextColor(11, 60, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ASECNA — RÉPERTOIRE DU PERSONNEL & AGENTS', 38, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Édité le : ${dateFormatted}`, 196, 17, { align: 'right' });

    // Titre
    doc.setTextColor(11, 60, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LISTE DES AGENTS ENREGISTRÉS SUR ASECPOINT', 14, 32);

    const tableData = users.map((u, i) => [
      (i + 1).toString(),
      u.matricule || 'N/A',
      `${u.nom || ''} ${u.prenom || ''}`.trim(),
      u.fonction || 'Agent',
      u.uniteNom || 'Non assigné',
      u.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Agent',
      u.active ? 'Actif' : 'Inactif'
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['N°', 'Matricule', 'Nom & Prénom', 'Fonction', 'Unité', 'Rôle', 'Statut']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 60, 112],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      margin: { top: 38, bottom: 20, left: 14, right: 14 }
    });

    const dateSlug = now.toISOString().split('T')[0];
    doc.save(`liste_agents_asecna_${dateSlug}.pdf`);
  }

  private drawSignaturesSection(
    doc: jsPDF, 
    y: number
  ): void {
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setFillColor(248, 250, 252);

    const boxWidth = 145;
    const boxX = (297 - boxWidth) / 2;
    doc.roundedRect(boxX, y, boxWidth, 30, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(11, 60, 112);
    doc.text('Chargé MIRE-I', boxX + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Date & Signature :', boxX + 5, y + 25);
  }

  private parsePhotos(photos?: string): string[] {
    if (!photos) return [];
    try {
      if (photos.startsWith('[')) {
        const parsed: unknown = JSON.parse(photos);
        return Array.isArray(parsed) ? parsed.filter((photo): photo is string => typeof photo === 'string') : [];
      }
      return photos.startsWith('data:') ? [photos] : [];
    } catch {
      return [];
    }
  }

  private getVisibleContent(content?: string): string {
    return (content || '').split(/\r?\n/)
      .filter(line => !/^\s*(Authentification|Adresse IP)\s*:/i.test(line))
      .join('\n');
  }

  private loadAsecnaLogo(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const logo = new Image();
      logo.onload = () => resolve(logo);
      logo.onerror = () => reject(new Error('Impossible de charger le logo ASECNA'));
      logo.src = new URL('assets/logo-asecna.png', document.baseURI).href;
    });
  }

  private drawAsecnaLogo(doc: jsPDF, logo: HTMLImageElement | null, x: number, y: number, width: number, height: number): void {
    if (logo) doc.addImage(logo, 'PNG', x, y, width, height);
  }

  private formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatTime(d: Date): string {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}
