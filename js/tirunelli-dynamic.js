window.addEventListener('load', function () {
  const sections = document.querySelectorAll('#projects .container .row.justify-content-center');

  let sectionIndex = 1;
  Object.keys(siteData).forEach((sectionType) => {
    if (siteData[sectionType]) {
      initializeSection(sectionType, siteData[sectionType], sectionIndex);
      sectionIndex++;
    }
  });

  const aboutSection = document.querySelector('#about');
  if (!aboutSection) {
      console.error('About section not found');
      return;
  }

  const mainContainer = document.createElement('div');
  mainContainer.className = 'container-fluid';
  mainContainer.style.padding = '2rem';

  const row = document.createElement('div');
  row.className = 'row';

  const leftColumn = document.createElement('div');
  leftColumn.className = 'col-lg-6';
  leftColumn.style.padding = '1rem';

  const currentPageId = 1;
  const currentItem = siteData.culthist.find(item => item.id === currentPageId);

  const imgContainer = document.createElement('div');
  imgContainer.style.marginBottom = '2rem';
  const img = document.createElement('img');
  img.src = currentItem.image;
  img.alt = currentItem.name;
  img.className = 'img-fluid';
  img.style.width = '100%';
  img.style.height = 'auto';
  img.style.borderRadius = '10px';
  imgContainer.appendChild(img);

  const descContainer = document.createElement('div');
  descContainer.innerHTML = `
      <h3 class="text-white mb-3">${currentItem.name}</h3>
      <p class="text-white-50 mb-3">${currentItem.description}</p>
      <div class="mb-3">
          <span class="text-warning">★ ${currentItem.rating}</span>
          <span class="text-white-50 ml-2">${currentItem.distance}km away</span>
      </div>
      <div class="mb-3">
          <small class="text-white-50">
              <i class="fas fa-clock"></i> ${currentItem.timing}<br>
              <i class="fas fa-phone"></i> ${currentItem.Contact}
          </small>
      </div>
  `;

  leftColumn.appendChild(imgContainer);
  leftColumn.appendChild(descContainer);

  const rightColumn = document.createElement('div');
  rightColumn.className = 'col-lg-6';
  rightColumn.style.padding = '1rem';

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'row';

  const filteredItems = siteData.culthist.filter(item => item.id !== currentPageId);

  filteredItems.forEach((item, index) => {
      const cardCol = document.createElement('div');
      cardCol.className = 'col-md-6 mb-4';

      const card = document.createElement('div');
      card.className = 'card bg-dark border-light h-100';
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

      card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = 'none';
      });

      card.innerHTML = `
          <div class="card-img-container" style="height: 200px; overflow: hidden;">
              <img src="${item.image}" class="card-img-top" alt="${item.name}" 
                   style="height: 100%; width: 100%; object-fit: cover; transition: transform 0.3s ease;">
          </div>
          <div class="card-body d-flex flex-column">
              <h5 class="card-title text-white">${item.name}</h5>
              <div class="rating mb-2">
                  <span class="text-warning">★ ${item.rating}</span>
                  <span class="text-white-50 ml-2">${item.distance}km away</span>
              </div>
              <p class="card-text text-white-50 flex-grow-1">${item.description}</p>
              <div class="card-footer-info mb-3">
                  <small class="text-white-50">
                      <i class="fas fa-clock"></i> ${item.timing}<br>
                      <i class="fas fa-phone"></i> ${item.Contact}
                  </small>
              </div>
              <a href="${item.knowmore}" class="btn btn-primary btn-sm mt-auto">Know More</a>
          </div>
      `;

      cardCol.appendChild(card);
      cardsContainer.appendChild(cardCol);
  });

  rightColumn.appendChild(cardsContainer);

  row.appendChild(leftColumn);
  row.appendChild(rightColumn);

  mainContainer.appendChild(row);

  aboutSection.innerHTML = '';
  aboutSection.appendChild(mainContainer);
});

function initializeSection(sectionType, data, sectionIndex) {
  let sectionContainer;
  let sectionTitle;

  const allSections = document.querySelectorAll('#projects .container .row.justify-content-center');

  const isOdd = sectionIndex % 2 === 1;

  if (sectionIndex - 1 < allSections.length) {
    sectionContainer = allSections[sectionIndex - 1];

    const titleElement = sectionContainer.querySelector('.project-text h4');
    if (titleElement) {
      sectionTitle = titleElement.textContent;
    } else {
      sectionTitle = sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
    }
  } else {
    return;
  }

  if (!sectionContainer) {
    return;
  }

  const imgColumn = sectionContainer.querySelector('.col-lg-6 img');
  if (!imgColumn) {
    return;
  }

  const imgColumnParent = imgColumn.closest('.col-lg-6');
  const contentColumn = sectionContainer.querySelector('.col-lg-6:not(:has(img))');
  const isImageOnRight = imgColumnParent.nextElementSibling === null || !imgColumnParent.nextElementSibling.classList.contains('col-lg-6');

  const imgElement = imgColumn;

  const arrowContainer = document.createElement('div');
  arrowContainer.className = 'arrows-container';
  sectionContainer.appendChild(arrowContainer);

  const leftArrow = document.createElement('div');
  leftArrow.className = 'tab-arrow tab-arrow-left';
  leftArrow.innerHTML = '&laquo;';
  leftArrow.setAttribute('aria-label', 'Previous tab');
  arrowContainer.appendChild(leftArrow);

  const rightArrow = document.createElement('div');
  rightArrow.className = 'tab-arrow tab-arrow-right';
  rightArrow.innerHTML = '&raquo;';
  rightArrow.setAttribute('aria-label', 'Next tab');
  arrowContainer.appendChild(rightArrow);

  let currentTabIndex = 0;

  leftArrow.addEventListener('click', function () {
    currentTabIndex = (currentTabIndex > 0) ? currentTabIndex - 1 : data.length - 1;
    updateContent('prev', isOdd);
  });

  rightArrow.addEventListener('click', function () {
    currentTabIndex = (currentTabIndex < data.length - 1) ? currentTabIndex + 1 : 0;
    updateContent('next', isOdd);
  });

  const textContainer = sectionContainer.querySelector('.project-text');
  if (!textContainer) {
    return;
  }

  textContainer.innerHTML = '';

  const titleElement = document.createElement('h4');
  titleElement.className = 'text-white';
  titleElement.textContent = sectionTitle;
  textContainer.appendChild(titleElement);

  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';
  textContainer.appendChild(tabContent);

  const hr = document.createElement('hr');
  hr.className = 'd-none d-lg-block mb-0 ' + (isImageOnRight ? 'ml-0' : 'mr-0');

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'img-wrapper';
  imgWrapper.style.position = 'relative';
  imgWrapper.style.overflow = 'hidden';
  imgWrapper.style.width = '100%';
  imgWrapper.style.height = '100%';

  imgElement.parentNode.insertBefore(imgWrapper, imgElement);
  imgWrapper.appendChild(imgElement);

  function updateContent(direction = 'next', isHorizontal = true) {
    const currentItem = data[currentTabIndex];

    const tempImg = document.createElement('img');
    tempImg.className = 'temp-image';
    tempImg.src = currentItem.image;
    tempImg.alt = currentItem.name;
    tempImg.style.position = 'absolute';
    tempImg.style.top = '0';
    tempImg.style.left = '0';
    tempImg.style.width = '100%';
    tempImg.style.height = '100%';
    tempImg.style.opacity = '0';

    if (isHorizontal) {
      tempImg.style.left = direction === 'next' ? '-100%' : '100%';
      tempImg.style.top = '0';
    } else {
      tempImg.style.top = direction === 'next' ? '-100%' : '100%';
      tempImg.style.left = '0';
    }

    imgWrapper.appendChild(tempImg);

    const oldImages = imgWrapper.querySelectorAll('img:not(.temp-image)');
    oldImages.forEach(oldImg => {
      oldImg.style.transition = 'all 0.5s ease';
      oldImg.style.opacity = '0';

      if (isHorizontal) {
        oldImg.style.left = direction === 'next' ? '100%' : '-100%';
      } else {
        oldImg.style.top = direction === 'next' ? '100%' : '-100%';
      }

      setTimeout(() => {
        oldImg.remove();
      }, 500);
    });

    const tempContent = document.createElement('div');
    tempContent.className = 'tab-content-temp';
    tempContent.innerHTML = `
      <h5 class="text-white">${currentItem.name} (${currentItem.rating}★)</h5>
      <p class="mb-0 text-white-50">${currentItem.description}</p>
      <a href="${currentItem.knowmore || '#'}"   class=" js-scroll-trigger">Know More</a>`;

    tempContent.style.position = 'absolute';
    tempContent.style.width = '100%';
    tempContent.style.opacity = '0';

    if (isHorizontal) {
      tempContent.style.left = direction === 'next' ? '-50px' : '50px';
    } else {
      tempContent.style.top = direction === 'next' ? '-50px' : '50px';
    }

    tabContent.appendChild(tempContent);

    const oldContents = tabContent.querySelectorAll('.tab-content-temp:not(:last-child)');
    oldContents.forEach(oldContent => {
      oldContent.style.transition = 'all 0.5s ease';
      oldContent.style.opacity = '0';

      if (isHorizontal) {
        oldContent.style.left = direction === 'next' ? '50px' : '-50px';
      } else {
        oldContent.style.top = direction === 'next' ? '50px' : '-50px';
      }

      setTimeout(() => {
        oldContent.remove();
      }, 500);
    });

    setTimeout(() => {
      tempImg.style.transition = 'all 0.5s ease';
      tempImg.style.opacity = '1';

      if (isHorizontal) {
        tempImg.style.left = '0';
      } else {
        tempImg.style.top = '0';
      }

      setTimeout(() => {
        tempImg.classList.remove('temp-image');
      }, 500);
    }, 50);

    setTimeout(() => {
      tempContent.style.transition = 'all 0.5s ease';
      tempContent.style.opacity = '1';

      if (isHorizontal) {
        tempContent.style.left = '0';
      } else {
        tempContent.style.top = '0';
      }
    }, 50);
  }

  updateContent('next', isOdd);
}


