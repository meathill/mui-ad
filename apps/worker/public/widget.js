(function() {
  // 查找所有带有 data-zone 属性的脚本标签
  const scripts = document.querySelectorAll('script[data-zone]');
  
  scripts.forEach(script => {
    const zoneId = script.getAttribute('data-zone');
    if (!zoneId) return;
    
    // 创建广告容器
    const container = document.createElement('div');
    container.className = 'muiad-ad-container';
    container.style.width = '100%';
    container.style.height = 'auto';
    container.style.minHeight = '200px';
    
    // 插入到脚本标签之后
    script.parentNode.insertBefore(container, script.nextSibling);
    
    // 加载广告
    loadAd(zoneId, container);
  });
  
  function loadAd(zoneId, container) {
    // 构建请求 URL
    const scriptUrl = document.currentScript.src;
    const baseUrl = scriptUrl.replace('/widget.js', '');
    const adUrl = `${baseUrl}/serve?zone=${zoneId}`;
    
    // 发送请求获取广告
    fetch(adUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load ad');
        }
        return response.text();
      })
      .then(html => {
        container.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading ad:', error);
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 200px; background-color: #f5f5f5; border: 1px solid #eee; border-radius: 4px;">广告加载失败</div>';
      });
  }
})();
