const { JSDOM } = require('jsdom');

/**
 * Utility class for parsing sailing events from HTML content
 * Shared by all providers that need to parse HTML
 */
class SailingHTMLParser {
  /**
   * Parses sailing events from HTML content
   * @param {string} html HTML content to parse
   * @returns {Array<Object>} Array of parsed sailing events
   */
  static parseSailingEvents(html) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const events = [];
    const boxes = doc.querySelectorAll('.single-yachts-box-sails .yachts-box, .siingle-yachts-box.single-yachts-box-sails');
    
    console.log(`Found ${boxes.length} sailing boxes`);
    
    if (boxes.length === 0) {
      console.log('No sailing boxes found in HTML content');
      return [];
    }
    
    boxes.forEach((box, index) => {
      console.log(`Processing box ${index + 1}:`, box.querySelector('h2')?.textContent?.trim());
      
      const event = SailingHTMLParser.parseEventBox(box);
      if (event.title) {
        events.push(event);
      }
    });
    
    return events;
  }

  /**
   * Parses a single event box
   * @param {Element} box DOM element representing a sailing event
   * @returns {Object} Parsed event object
   */
  static parseEventBox(box) {
    // Title
    const titleEl = box.querySelector('h2');
    const title = titleEl ? titleEl.textContent.trim() : '';
    
    // Date and times
    const { dateStr, startTime, endTime } = SailingHTMLParser.parseDateTime(box);
    
    // Description
    const descEl = box.querySelector('span.text-truncate');
    const description = descEl ? descEl.textContent.trim() : '';
    
    // Meta (boat, branch, pier)
    const { boat, branch, pier } = SailingHTMLParser.parseMetaData(box);
    
    // URLs
    const moreLink = box.querySelector('a.btn-more-detail');
    const moreUrl = moreLink ? moreLink.href : '';
    const orderLink = box.querySelector('a.btn-cart');
    const orderUrl = orderLink ? orderLink.href : '';
    
    // Determine event type
    const eventType = title.includes('טרום') ? 'טרום מעשי' : 'תלמידים';
    
    // Compute day of week
    const dayOfWeek = SailingHTMLParser.computeDayOfWeek(dateStr);
    
    // Price
    const priceEl = box.querySelector('.sail-price');
    const price = priceEl ? priceEl.textContent.trim() : '';
    
    return {
      title,
      date: dateStr,
      startTime,
      endTime,
      dayOfWeek,
      description,
      boat,
      branch,
      pier,
      eventType,
      moreUrl,
      orderUrl,
      price
    };
  }

  /**
   * Parses date and time information from event box
   * @param {Element} box DOM element
   * @returns {Object} Date and time information
   */
  static parseDateTime(box) {
    let dateStr = '';
    let startTime = '';
    let endTime = '';
    
    const dateLabel = box.querySelector('.sail-time-date-label');
    if (dateLabel) {
      const text = dateLabel.textContent.trim().replace(/\s+/g, ' ');
      // text format: '27/10/2025 14:00 - 16:00'
      const match = text.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (match) {
        dateStr = match[1];
        startTime = match[2];
        endTime = match[3];
      }
    }
    
    return { dateStr, startTime, endTime };
  }

  /**
   * Parses metadata (boat, branch, pier) from event box
   * @param {Element} box DOM element
   * @returns {Object} Metadata information
   */
  static parseMetaData(box) {
    let boat = '';
    let branch = '';
    let pier = '';
    
    const metaList = box.querySelector('ul.meta-list-sail');
    if (metaList) {
      metaList.querySelectorAll('li.main-items').forEach(li => {
        const labelSpan = li.querySelector('span.messages');
        const label = labelSpan ? labelSpan.textContent.trim() : '';
        
        // The value is in a span that's a direct child of li, not inside the d-flex div
        const valueSpan = li.querySelector('span:not(.messages):not(.flaticon-boat-1):not(.flaticon-boat-2):not(.flaticon-boat-3)');
        const value = valueSpan ? valueSpan.textContent.trim() : '';
        
        if (label.includes('כלי השייט')) {
          boat = value;
        } else if (label.includes('סניף')) {
          branch = value;
        } else if (label.includes('רציף')) {
          pier = value;
        }
      });
    }
    
    return { boat, branch, pier };
  }

  /**
   * Computes Hebrew day of week from date string
   * @param {string} dateStr Date string in DD/MM/YYYY format
   * @returns {string} Hebrew day of week symbol
   */
  static computeDayOfWeek(dateStr) {
    if (!dateStr) return '';
    
    const [d, m, y] = dateStr.split('/');
    const jsDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    // JavaScript getDay(): 0=Sunday, 1=Monday, etc.
    const dayIndex = jsDate.getDay();
    const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return hebrewDays[dayIndex];
  }

  /**
   * Validates if HTML contains expected sailing content
   * @param {string} html HTML content to validate
   * @returns {boolean} True if content is valid
   */
  static validateSailingContent(html) {
    const hasSailingContent = html.includes('single-yachts-box-sails') || 
                             html.includes('yachts-box') ||
                             html.includes('siingle-yachts-box') ||
                             html.includes('הפלגות') ||
                             html.includes('sailing');
    
    console.log('Has sailing content:', hasSailingContent);
    return hasSailingContent;
  }
}

module.exports = SailingHTMLParser;
