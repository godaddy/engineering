(async () => {
  const url = 'https://godaddy-featured-repos.now.sh';

  const dom = {
    select: document.querySelector.bind(document)
  };

  const textColorFromBackgroundColor = color => {
    if (color.length < 5) {
      color += color.slice(1);
    }

    return parseInt(color.replace('#', '0x'), 16) > (0xFFFFFF / 2) ? '#333' : '#fff';
  };

  try {
    const json = await (await fetch(url)).json();
    const repos = json.reverse().filter(repo => !!repo.description);

    if (!repos.length) {
      return unloadRow();
    }

    const template = dom.select('#featured-repo-template');
    const container = dom.select('#featured-repos');

    const indicatorTemplate = dom.select('#featured-carousel-indicator');
    const indicatorsContainer = dom.select('#featured-repos-indicators');

    repos.forEach((repo, i) => {
      const content = template.cloneNode(true).content;
      const indicator = indicatorTemplate.cloneNode(true).content;

      indicator.querySelector('li').setAttribute('data-slide-to', i);

      const a = content.querySelector('.featured-repo-title');
      a.href = repo.url;
      a.textContent = repo.name;

      if (repo.primaryLanguage) {
        const lang = content.querySelector('.featured-repo-language');
        lang.textContent = repo.primaryLanguage.name;
        lang.style.color = textColorFromBackgroundColor(repo.primaryLanguage.color);
        lang.style.backgroundColor = repo.primaryLanguage.color;
      }

      content.querySelector('.featured-repo-description').textContent = repo.description;

      const stargazersText = repo.stargazers === 1 ? '1 Star' : `${repo.stargazers} Stars`;
      const starsButton = content.querySelector('.button-stargazers-count');
      starsButton.href = `${repo.url}/stargazers`
      starsButton.textContent = stargazersText;

      const forksText = repo.forks === 1 ? '1 Fork' : `${repo.forks} Forks`;
      const forksButton = content.querySelector('.button-forks-count');
      forksButton.href = `${repo.url}/network/members`
      forksButton.textContent = forksText;

      if (i === 0) {
        content.querySelector('.carousel-item').classList.add('active');
        indicator.querySelector('li').classList.add('active')
      }

      container.appendChild(document.importNode(content, true));
      indicatorsContainer.appendChild(document.importNode(indicator, true));
    });

    dom.select('.featured-repos').classList.remove('d-none');
  } catch (error) {
    console.warn('Error rendering featured repos.', error);
  }
})();
