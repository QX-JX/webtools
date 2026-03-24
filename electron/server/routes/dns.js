import { Router } from 'express';
import dns from 'dns';
import { promisify } from 'util';
const router = Router();
// Promisify DNS methods
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);
const resolveNs = promisify(dns.resolveNs);
const resolveSoa = promisify(dns.resolveSoa);
// DNS 查询
router.post('/lookup', async (req, res) => {
    try {
        const { domain, type = 'ALL' } = req.body;
        if (!domain) {
            res.json({ success: false, message: '域名不能为空' });
            return;
        }
        // 清理域名格式
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();
        const records = [];
        const errors = [];
        // 根据类型查询
        const queryTypes = type === 'ALL' ? ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA'] : [type];
        for (const queryType of queryTypes) {
            try {
                switch (queryType) {
                    case 'A':
                        const aRecords = await resolve4(cleanDomain);
                        aRecords.forEach(ip => records.push({ type: 'A', value: ip }));
                        break;
                    case 'AAAA':
                        const aaaaRecords = await resolve6(cleanDomain);
                        aaaaRecords.forEach(ip => records.push({ type: 'AAAA', value: ip }));
                        break;
                    case 'MX':
                        const mxRecords = await resolveMx(cleanDomain);
                        mxRecords.forEach(mx => records.push({
                            type: 'MX',
                            value: mx.exchange,
                            priority: mx.priority
                        }));
                        break;
                    case 'TXT':
                        const txtRecords = await resolveTxt(cleanDomain);
                        txtRecords.forEach(txt => records.push({ type: 'TXT', value: txt.join('') }));
                        break;
                    case 'CNAME':
                        const cnameRecords = await resolveCname(cleanDomain);
                        cnameRecords.forEach(cname => records.push({ type: 'CNAME', value: cname }));
                        break;
                    case 'NS':
                        const nsRecords = await resolveNs(cleanDomain);
                        nsRecords.forEach(ns => records.push({ type: 'NS', value: ns }));
                        break;
                    case 'SOA':
                        const soaRecord = await resolveSoa(cleanDomain);
                        records.push({
                            type: 'SOA',
                            value: `${soaRecord.nsname} ${soaRecord.hostmaster}`,
                            ttl: soaRecord.minttl
                        });
                        break;
                }
            }
            catch (err) {
                // 某些记录类型可能不存在，忽略错误
                if (type !== 'ALL') {
                    errors.push(`${queryType}: ${err.message}`);
                }
            }
        }
        if (records.length === 0 && errors.length > 0) {
            res.json({ success: false, message: errors.join('; ') });
            return;
        }
        res.json({
            success: true,
            data: {
                domain: cleanDomain,
                records,
                queryTime: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('DNS lookup error:', error);
        res.json({ success: false, message: '查询失败: ' + error.message });
    }
});
export default router;
