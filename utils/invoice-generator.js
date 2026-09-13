// ─────────────────────────────────────────────────────────────────────────────
// utils/invoice-generator.js
//
// Universal Tax Invoice Builder & High-Definition PDF Generator
// Standardized across My Orders Drawer, Checkout, and Customer Email dispatch.
// ─────────────────────────────────────────────────────────────────────────────

window.buildInvoiceHtml = function(inv) {
    if (!inv) return '';
    const sh = inv.shipping || {};
    const dateStr = inv.createdAt 
        ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : (inv.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));

    const qty = inv.quantity || 1;
    const amount = inv.amount || inv.price || 900;
    const orderNumber = inv.orderId || inv.paymentId || 'ORD' + Date.now();
    const formattedPrice = isNaN(Number(amount)) ? amount : (Number(amount) > 2000 && Number(amount) % 100 === 0 ? Math.round(Number(amount)/100) : amount);

    return `
        <div id="invoice-render-node" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; color: #0f172a; padding: 32px 28px; line-height: 1.5; max-width: 760px; margin: 0 auto; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
                <div>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">Line and Layer Gallery</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Where strokes meet dimensions • line-art-gallery.netlify.app</div>
                    <div style="font-size: 12px; color: #475569; margin-top: 8px;">Order #${orderNumber}</div>
                </div>
                <div style="text-align: right;">
                    <span style="display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; margin-bottom: 4px; border: 1px solid #a7f3d0;">Payment Confirmed</span>
                    <div style="font-size: 12px; color: #475569;"><strong>Date:</strong> ${dateStr}</div>
                    <div style="font-size: 12px; color: #475569;"><strong>Payment ID:</strong> ${inv.paymentId || 'Prepaid'}</div>
                </div>
            </div>

            <div style="display: flex; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; font-size: 13px;">
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Billed & Shipped To</div>
                    <strong style="color: #0f172a; font-size: 14px;">${sh.fullName || 'Valued Customer'}</strong><br/>
                    ${sh.address1 || ''}${sh.address2 ? ', ' + sh.address2 : ''}<br/>
                    ${sh.city || ''}${sh.state ? ', ' + sh.state : ''} ${sh.pincode ? ' - ' + sh.pincode : ''}<br/>
                    ${sh.phone ? 'Phone: ' + sh.phone + '<br/>' : ''}
                    ${inv.email ? 'Email: ' + inv.email : ''}
                </div>
                <div style="flex: 1; border-left: 1px solid #e2e8f0; padding-left: 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Fulfillment Details</div>
                    <strong>Status:</strong> ${inv.fulfillment === 'submitted' ? 'Sent for Printing & Framing (QikInk)' : 'Payment Verified'}<br/>
                    <strong>Carrier:</strong> QikInk Shipping (Prepaid)<br/>
                    <strong>Estimated Delivery:</strong> 5–7 Business Days
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="text-align: left; padding: 10px 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1;">Artwork Item</th>
                        <th style="text-align: center; padding: 10px 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1;">Format / Specs</th>
                        <th style="text-align: center; padding: 10px 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1;">Qty</th>
                        <th style="text-align: right; padding: 10px 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                            <strong style="color: #0f172a; font-size: 14px;">${inv.artName || 'Art Print'}</strong>
                        </td>
                        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">
                            ${inv.vLabel || inv.sku || 'T-Shirt Print'}
                        </td>
                        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">
                            ${qty}
                        </td>
                        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                            ₹${formattedPrice}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="font-weight: 800; font-size: 15px; border-top: 2px solid #0f172a;">
                        <td colspan="3" style="text-align: right; padding: 12px; color: #0f172a;">Total Paid:</td>
                        <td style="text-align: right; padding: 12px; color: #0f172a;">₹${formattedPrice}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                Thank you for supporting independent art! For support or inquiries, contact <a href="mailto:manthanparekh9d@gmail.com" style="color: #0284c7; text-decoration: none;">manthanparekh9d@gmail.com</a>
            </div>
        </div>
    `;
};

window.downloadInvoicePdf = function(inv) {
    if (!inv) return;
    const htmlContent = window.buildInvoiceHtml(inv);
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '760px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const opt = {
        margin:       [8, 8, 8, 8],
        filename:     `Invoice-${inv.orderId || inv.paymentId || 'receipt'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
        window.html2pdf().set(opt).from(container.querySelector('#invoice-render-node') || container).save().then(() => {
            if (container.parentNode) container.parentNode.removeChild(container);
        }).catch(err => {
            console.warn('[html2pdf] Falling back to standard print dialog:', err);
            if (container.parentNode) container.parentNode.removeChild(container);
            const printWin = window.open('', '_blank', 'width=800,height=900');
            if (printWin) {
                printWin.document.write(`<!DOCTYPE html><html><head><title>Invoice #${inv.orderId}</title></head><body>${htmlContent}<script>window.onload=function(){window.print();};<\/script></body></html>`);
                printWin.document.close();
            }
        });
    } else {
        if (container.parentNode) container.parentNode.removeChild(container);
        const printWin = window.open('', '_blank', 'width=800,height=900');
        if (printWin) {
            printWin.document.write(`<!DOCTYPE html><html><head><title>Invoice #${inv.orderId}</title></head><body>${htmlContent}<script>window.onload=function(){window.print();};<\/script></body></html>`);
            printWin.document.close();
        }
    }
};

window.dispatchCustomerInvoiceEmail = function(info) {
    if (!info) return;
    const sh = info.shipping || {};
    const targetEmail = info.email || (window.Clerk?.user?.primaryEmailAddress?.emailAddress) || '';

    if (window.emailjs && targetEmail) {
        try {
            const formattedPrice = isNaN(Number(info.price)) ? info.price : (Number(info.price) > 2000 && Number(info.price) % 100 === 0 ? Math.round(Number(info.price)/100) : info.price);
            
            emailjs.init('_aYo3S4YB97RmUEzE');
            emailjs.send('service_5mb4ond', 'template_j5wozvn', {
                type:      'Official Tax Invoice',
                name:      sh.fullName || 'Art Collector',
                to_email:  targetEmail,
                email:     targetEmail,
                message:   `Official Tax Invoice & Order Confirmation for Order #${info.orderId}\n\nItem: ${info.artName} (${info.vLabel})\nQuantity: ${info.quantity || 1}\nAmount Paid: ₹${formattedPrice}\nPayment ID: ${info.paymentId}\nShipping Address: ${sh.fullName || ''}, ${sh.address1 || ''}, ${sh.city || ''}, ${sh.state || ''} - ${sh.pincode || ''}\nCarrier: QikInk Shipping (Prepaid)\nEstimated Delivery: 5–7 Business Days\n\nYou can view and download your official invoice PDF anytime from 'My Orders' on our website.`,
                image_url: info.imgUrl || '',
                time:      info.date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            }).then(() => {
                console.log('[EmailJS] Official invoice email dispatched to', targetEmail);
            }).catch(err => {
                console.warn('[EmailJS] Invoice email dispatch warning:', err);
            });
        } catch (e) {
            console.warn('[EmailJS] Email error:', e);
        }
    }
};
