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


   var  currentPageId = getCurrentPageId();
  var  currentcatId = getCurrentCatagoryId();

//alert((Object.values(siteData)[0])[0].image)
 // Main page  content start here
  var currentItem = Object.values(siteData)[currentcatId].filter(item => item.id === eval(currentPageId));

//alert(currentPageId + " " +currentcatId + " " + currentItem);

  const imgContainer = document.createElement('div');
  imgContainer.style.marginBottom = '2rem';
  imgContainer.style.position = 'relative';
  imgContainer.style.overflow = 'hidden';
  imgContainer.style.width = '100%';
  imgContainer.style.height = '400px';

  // Create a wrapper for the images
  const imgWrapper = document.createElement('div');
  imgWrapper.style.position = 'relative';
  imgWrapper.style.width = '100%';
  imgWrapper.style.height = '100%';
  imgWrapper.style.transition = 'transform 0.5s ease';
  imgWrapper.style.display = 'flex';

  // Add image navigation arrows with improved design
  const leftArrow = document.createElement('div');
  leftArrow.className = 'image-nav-arrow image-nav-left';
  leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
  leftArrow.style.position = 'absolute';
  leftArrow.style.left = '15px';
  leftArrow.style.top = '50%';
  leftArrow.style.transform = 'translateY(-50%)';
  leftArrow.style.zIndex = '2';
  leftArrow.style.cursor = 'pointer';
  leftArrow.style.color = 'white';
  leftArrow.style.fontSize = '20px';
  leftArrow.style.backgroundColor = 'rgba(0,0,0,0.6)';
  leftArrow.style.padding = '15px 15px';
  leftArrow.style.borderRadius = '50%';
  leftArrow.style.display = 'none';
  leftArrow.style.transition = 'all 0.3s ease';
  leftArrow.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

  const rightArrow = document.createElement('div');
  rightArrow.className = 'image-nav-arrow image-nav-right';
  rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
  rightArrow.style.position = 'absolute';
  rightArrow.style.right = '15px';
  rightArrow.style.top = '50%';
  rightArrow.style.transform = 'translateY(-50%)';
  rightArrow.style.zIndex = '2';
  rightArrow.style.cursor = 'pointer';
  rightArrow.style.color = 'white';
  rightArrow.style.fontSize = '20px';
  rightArrow.style.backgroundColor = 'rgba(0,0,0,0.6)';
  rightArrow.style.padding = '15px 15px';
  rightArrow.style.borderRadius = '50%';
  rightArrow.style.display = 'none';
  rightArrow.style.transition = 'all 0.3s ease';
  rightArrow.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

  // Add hover effects for arrows
  leftArrow.addEventListener('mouseenter', () => {
    leftArrow.style.backgroundColor = 'rgba(0,0,0,0.8)';
    leftArrow.style.transform = 'translateY(-50%) scale(1.1)';
  });
  leftArrow.addEventListener('mouseleave', () => {
    leftArrow.style.backgroundColor = 'rgba(0,0,0,0.6)';
    leftArrow.style.transform = 'translateY(-50%) scale(1)';
  });
  rightArrow.addEventListener('mouseenter', () => {
    rightArrow.style.backgroundColor = 'rgba(0,0,0,0.8)';
    rightArrow.style.transform = 'translateY(-50%) scale(1.1)';
  });
  rightArrow.addEventListener('mouseleave', () => {
    rightArrow.style.backgroundColor = 'rgba(0,0,0,0.6)';
    rightArrow.style.transform = 'translateY(-50%) scale(1)';
  });

  // Get the first item from currentItem array
  const currentItemData = currentItem[0];

  //	alert( currentItem[0])

  const images = currentItemData.image;
  const imageArray = Array.isArray(images) ? images : [images];
  let currentImageIndex = 0;

  // Create all images upfront
  imageArray.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = currentItemData.name;
    img.className = 'img-fluid';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = `${index * 100}%`;
    img.style.transition = 'transform 0.5s ease';
    img.style.minWidth = '100%';
    imgWrapper.appendChild(img);
  });


  // Add hover effect to show arrows
 // imgContainer.addEventListener('mouseenter', () => {
    if (imageArray.length > 1) {
      leftArrow.style.display = 'block';
      rightArrow.style.display = 'block';
    }
 // });

//  imgContainer.addEventListener('mouseleave', () => {
   // leftArrow.style.display = 'none';
   // rightArrow.style.display = 'none';
//  });


  // Image navigation logic with sliding animation
  function updateImage(direction) {
    if (imageArray.length <= 1) return;

    const newIndex = direction === 'next'
      ? (currentImageIndex + 1) % imageArray.length
      : (currentImageIndex - 1 + imageArray.length) % imageArray.length;

    imgWrapper.style.transform = `translateX(-${newIndex * 100}%)`;
    currentImageIndex = newIndex;
  }

  leftArrow.addEventListener('click', () => updateImage('prev'));
  rightArrow.addEventListener('click', () => updateImage('next'));

  imgContainer.appendChild(imgWrapper);
  imgContainer.appendChild(leftArrow);
  imgContainer.appendChild(rightArrow);

  const descContainer = document.createElement('div');
  descContainer.innerHTML = `
      <h3 class="text-white mb-3">${currentItemData.name}</h3>
      <div class="mb-3">
          <a href="#nearby-places"><span class="text-warning">View places with in 15 Kms </span></a> </div>
      <div class="mb-3">
          <span class="text-warning">★ ${currentItemData.rating}</span>
          <span class="text-white-50 ml-2">${currentItemData.distance}km from Kalpetta</span>
		  <span class="text-white-50 ml-2">
			<a href="${currentItemData.map}" target="_new" class="text-decoration-none text-white">
			<i class="fas fa-map-marker-alt" style="color: #64a19d;"></i>
			</a>
		  </span>

 </div>
      <div class="mb-3">
          <small class="text-white-50">
            <ul style="list-style:none;">
            <li><i class="fas fa-clock"></i> Timing: ${currentItemData.timing}<br></li>
            <li><i class="fas fa-car-side"></i> Transportation: ${currentItemData.transport}</li>
            <li><i class="fas fa-cog"></i> Best Seasons to Visit: ${currentItemData.seasontovisit}</li>
            <li><i class="fas fa-bell"></i> Type: ${currentItemData.type}</li>
            <li><i class="fas fa-power-off"></i> Holiday: ${currentItemData.holidays}</li>
            <li><i class="fas fa-phone"></i> Contact: ${currentItemData.Contact}</li>
            <li><img alt="Black and White Stays Wayanad"  width="20" height="20" src="assets/img/icons/cloudy.png" alt="Black and White Stays Wayanad" />Weather: <span id="temperature"></span></p> </li>
            </ul>
        </small>
      </div>
      <div class="mb-3">
                 <span class="text-white-50 ml-2">${currentItemData.description}</span>
       </div>
  `;


 //update the location nearby with the location name choosen
 $('h2').text("Location Nearby " + currentItemData.name);



  leftColumn.appendChild(imgContainer);

  leftColumn.appendChild(descContainer);
 // main page content end here




  // right pane heading

  const rightColumnHead = document.createElement('div');
  rightColumnHead.className = 'col-lg-7';
  rightColumnHead.style.padding = '1rem';
  rightColumnHead.description = 'places';
  rightColumnHead.className = 'border-bottom border-primary text-center mb-4';
  rightColumnHead.style ='width:100%;margin:0 auto';
  rightColumnHead.innerHTML = `
      <h5 class="text-white">${currentItemData.type} Places</h5>  `;

  // right pane content
  const rightColumn = document.createElement('div');
  rightColumn.className = 'col-lg-6';
  rightColumn.style.padding = '1rem';

    rightColumn.appendChild(rightColumnHead);

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'row';

  const filteredItems =  Object.values(siteData)[currentcatId].filter(item => item.id !== eval(currentPageId));

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

      const itemImages = Array.isArray(item.image) ? item.image : [item.image];
      const firstImage = itemImages[0];

      card.innerHTML = `
          <div class="card-img-container" style="height: 200px; overflow: hidden;">
              <img alt="Black and White Stays Wayanad" src="${firstImage}" class="card-img-top" alt="${item.name}"
                   style="height: 100%; width: 100%; object-fit: cover; transition: transform 0.3s ease;">
          </div>
          <div class="card-body d-flex flex-column">
              <h5 class="card-title text-white">${item.name}</h5>
              <div class="rating mb-2">
                  <span class="text-warning">★ ${item.rating}</span>
                  <span class="text-white-50 ml-2">${item.distance}km from Kalpetta</span>

                    <span class="text-white-50 ml-2"><a href="${currentItemData.map}" target="_new" class="text-decoration-none text-white">
				  			<i class="fas fa-map-marker-alt" style="color: #64a19d;"></i>
						</a>
						</span>
              </div>
              <p class="card-text text-white-50 flex-grow-1">${item.description.substring(0,100)}...</p>
              <div class="card-footer-info mb-3">
                  <small class="text-white-50">
                      <i class="fas fa-clock"></i> ${item.timing}<br>
                      <i class="fas fa-car-side"></i> ${item.transport} <br>
					            <i class="fas fa-calendar-week"></i> ${item.holidays} <br>
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
      <p class="mb-0 text-white-50">${currentItem.description.substring(0,100)}...</p>
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


