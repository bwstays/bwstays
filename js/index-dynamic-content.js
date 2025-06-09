window.addEventListener('load', function () {
  // //console.log('DOM fully loaded');

  // Get all sections first
  const sections = document.querySelectorAll('#projects .container .row.justify-content-center');
  // //console.log('Total sections found:', sections.length);

  // Dynamically initialize each section based on the data available
  // This will work for any number of sections
  let sectionIndex = 1;
  Object.keys(siteData).forEach((sectionType) => {
    if (siteData[sectionType]) {
      initializeSection(sectionType, siteData[sectionType], sectionIndex);
      sectionIndex++;
    }
  });
});

function initializeSection(sectionType, data, sectionIndex) {
  let sectionContainer;
  let sectionTitle;

  // Get all sections to ensure we're targeting the correct one
  const allSections = document.querySelectorAll('#projects .container .row.justify-content-center');

  // Determine if this is an odd or even section
  const isOdd = sectionIndex % 2 === 1;

  // Find the section container by index
  if (sectionIndex - 1 < allSections.length) {
    sectionContainer = allSections[sectionIndex - 1];

    // Try to get the section title from the HTML
    const titleElement = sectionContainer.querySelector('.project-text h4');
    if (titleElement) {
      sectionTitle = titleElement.textContent;
    } else {
      // Fallback to generating a title from the section type
      sectionTitle = sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
    }
  } else {
    //console.error('Section container not found for index:', sectionIndex);
    return;
  }

  if (!sectionContainer) {
    //console.error('Section container not found for:', sectionType);
    //console.log('Available sections:', allSections.length);
    return;
  }

  //console.log(`Found section for ${sectionType}:`, sectionContainer);

  // Check if the section has the necessary structure
  const imgColumn = sectionContainer.querySelector('.col-lg-6 img');
  if (!imgColumn) {
    //console.error(`Section ${sectionType} does not have the required image column structure`);
    return;
  }

  const imgColumnParent = imgColumn.closest('.col-lg-6');
  const contentColumn = sectionContainer.querySelector('.col-lg-6:not(:has(img))');
  const isImageOnRight = imgColumnParent.nextElementSibling === null || !imgColumnParent.nextElementSibling.classList.contains('col-lg-6');

  const imgElement = imgColumn;




  const arrowContainer = document.createElement('div');
  arrowContainer.className = 'arrows-container';
  sectionContainer.appendChild(arrowContainer);

  // Always create horizontal arrows (left-right placement) for all sections
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

  // Set up event listeners based on whether the section is odd or even
  let currentTabIndex = 0;

  leftArrow.addEventListener('click', function () {
    currentTabIndex = (currentTabIndex > 0) ? currentTabIndex - 1 : data.length - 1;
    updateContent('prev', isOdd); // Pass isOdd to determine navigation type
  });

  rightArrow.addEventListener('click', function () {
    currentTabIndex = (currentTabIndex < data.length - 1) ? currentTabIndex + 1 : 0;
    updateContent('next', isOdd); // Pass isOdd to determine navigation type
  });

  const textContainer = sectionContainer.querySelector('.project-text');
  if (!textContainer) {
    //console.error('Text container not found');
    return;
  }

  textContainer.innerHTML = '';

  const titleElement = document.createElement('h4');
  titleElement.className = 'text-white';
  titleElement.textContent = sectionTitle;
  textContainer.appendChild(titleElement);

  const line = document.createElement('div');
  line.className = 'border-bottom border-primary text-center mb-4';
  line.style ='width:100%;margin:0 auto';
  textContainer.appendChild(line);


  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';
  textContainer.appendChild(tabContent);

  const hr = document.createElement('hr');
  hr.className = 'd-none d-lg-block mb-0 ' + (isImageOnRight ? 'ml-0' : 'mr-0');
  // textContainer.appendChild(hr);

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

    // Create temporary image for animation
    const tempImg = document.createElement('img');
    tempImg.className = 'temp-image';
    tempImg.src = Array.isArray(currentItem.image) ? currentItem.image[0] : currentItem.image;
    tempImg.alt = currentItem.name;
    tempImg.style.position = 'absolute';
    tempImg.style.top = '0';
    tempImg.style.left = '0';
    tempImg.style.width = '100%';
    tempImg.style.height = '100%';
    tempImg.style.opacity = '0';

    // Set initial position based on navigation type and direction
    if (isHorizontal) {
      // Horizontal navigation (left-right)
      tempImg.style.left = direction === 'next' ? '-100%' : '100%';
      tempImg.style.top = '0';
    } else {
      // Vertical navigation (top-bottom)
      tempImg.style.top = direction === 'next' ? '-100%' : '100%';
      tempImg.style.left = '0';
    }

    imgWrapper.appendChild(tempImg);

    // Animate old image out
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

    // Create temporary content for animation
    const tempContent = document.createElement('div');
    tempContent.className = 'tab-content-temp';
    tempContent.innerHTML = `
      <h5 class="text-white">${currentItem.name} (${currentItem.rating}★)</h5>
      <p class="mb-0 text-white-50">${currentItem.description.substring(0,100)}....</p>
      <i class="fas fa-times me-1" style="color: #64a19d;"></i> Holiday: ${currentItem.holidays}<br>
      <i class="fas fa-clock me-1" style="color: #64a19d;"></i> Timing: ${currentItem.timing}<br>
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

    // Animate old content out
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

    // Animate new image in
    setTimeout(() => {
      tempImg.style.transition = 'all 0.5s ease';
      tempImg.style.opacity = '1';

      if (isHorizontal) {
        tempImg.style.left = '0';
      } else {
        tempImg.style.top = '0';
      }

      // Remove temp-image class after animation
      setTimeout(() => {
        tempImg.classList.remove('temp-image');
      }, 500);
    }, 50);

    // Animate new content in
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


