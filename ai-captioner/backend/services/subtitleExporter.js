/**
 * [AI Engineer 담당] 멀티포맷 자막 내보내기 서비스
 * - SRT, VTT, ASS, TXT 4종 포맷 지원
 * - 서버사이드 + 클라이언트사이드 모두 사용 가능
 */

/**
 * SRT 포맷 생성
 */
function toSRT(segments) {
    return segments.map((seg, i) => {
        return `${i + 1}\n${formatSRT(seg.start)} --> ${formatSRT(seg.end)}\n${seg.text}\n`;
    }).join('\n');
}

/**
 * WebVTT 포맷 생성
 */
function toVTT(segments) {
    let vtt = 'WEBVTT\n\n';
    vtt += segments.map((seg, i) => {
        return `${i + 1}\n${formatVTT(seg.start)} --> ${formatVTT(seg.end)}\n${seg.text}\n`;
    }).join('\n');
    return vtt;
}

/**
 * ASS (Advanced SubStation Alpha) 포맷 생성
 */
function toASS(segments, style = {}) {
    const fontName = style.fontFamily || 'Pretendard';
    const fontSize = style.fontSize || 24;
    const primaryColor = assColor(style.color || '#FFFFFF');
    const bgColor = assColor(style.bgColor || '#000000', 128);
    const bold = style.bold ? -1 : 0;
    const italic = style.italic ? -1 : 0;

    let ass = `[Script Info]
Title: AI Captioner PRO Export
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,&H00000000,${bgColor},${bold},${italic},0,0,100,100,0,0,1,2,1,2,10,10,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    segments.forEach(seg => {
        const start = formatASS(seg.start);
        const end = formatASS(seg.end);
        ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${seg.text}\n`;
    });

    return ass;
}

/**
 * 순수 텍스트 포맷 생성 (타임스탬프 포함)
 */
function toTXT(segments, includeTimestamps = true) {
    return segments.map(seg => {
        if (includeTimestamps) {
            return `[${formatSimple(seg.start)} - ${formatSimple(seg.end)}] ${seg.text}`;
        }
        return seg.text;
    }).join('\n');
}

// === 시간 포맷 헬퍼 ===
function formatSRT(seconds) {
    const ms = Math.max(0, Math.round(seconds * 1000));
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const milli = String(ms % 1000).padStart(3, '0');
    return `${h}:${m}:${s},${milli}`;
}

function formatVTT(seconds) {
    return formatSRT(seconds).replace(',', '.');
}

function formatASS(seconds) {
    const ms = Math.max(0, Math.round(seconds * 1000));
    const h = Math.floor(ms / 3600000);
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return `${h}:${m}:${s}.${cs}`;
}

function formatSimple(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function assColor(hex, alpha = 0) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const a = String(alpha.toString(16)).padStart(2, '0').toUpperCase();
    return `&H${a}${b.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${r.toString(16).padStart(2, '0').toUpperCase()}`;
}

// === 내보내기 유틸 ===
function exportSubtitles(segments, format = 'srt', style = {}) {
    const formats = {
        srt: { fn: toSRT, ext: '.srt', mime: 'text/plain' },
        vtt: { fn: toVTT, ext: '.vtt', mime: 'text/vtt' },
        ass: { fn: (s) => toASS(s, style), ext: '.ass', mime: 'text/plain' },
        txt: { fn: toTXT, ext: '.txt', mime: 'text/plain' },
    };

    const config = formats[format] || formats.srt;
    const content = config.fn(segments);
    return { content, ext: config.ext, mime: config.mime };
}

module.exports = { toSRT, toVTT, toASS, toTXT, exportSubtitles };
