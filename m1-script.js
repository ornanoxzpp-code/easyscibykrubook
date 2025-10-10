Document.addEventListener('DOMContentLoaded', () => {
    
    // *** ✅ CONFIG: URL ของ Apps Script ที่คุณ Deploy มาจาก Google Sheet ม.1 (อันล่าสุด) ✅ ***
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBux71ffOo12kaltqcuycPdpo5qBupLmfTv9dvClot6m80RTETRV_fEZ-aRrvfRMSeJQ/exec'; 
    
    // ------------------------------------------------------------------
    // เลือกองค์ประกอบที่ใช้ในการทำงาน
    // ------------------------------------------------------------------
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    const transferDetails = document.getElementById('transfer-details');
    const bookingFormArea = document.getElementById('booking-form-area');
    const nextToFormButton = document.getElementById('next-to-form');
    const backToDetailsButton = document.getElementById('back-to-details');
    const currentDeskInfoStep1 = document.getElementById('current-desk-info-step1');
    const currentDeskInfoStep2 = document.getElementById('current-desk-info-step2');
    
    let selectedSeat = null; 
    let submittedName = ''; // ตัวแปรสำหรับเก็บชื่อที่เพิ่งจอง
    
    
    // ------------------------------------------------------------------
    // 1. ฟังก์ชันดึงสถานะจาก Google Sheet (Real-time update)
    // ------------------------------------------------------------------
    const fetchSeatStatus = async () => {
        try {
            // ดึงข้อมูลสถานะที่นั่งทั้งหมด (ใช้ JSONP)
            const response = await fetch(`${APPS_SCRIPT_URL}?callback=handleResponse`);
            const text = await response.text();

            // แยกข้อมูล JSON ออกมา (ตัด callback function name ออก)
            const jsonString = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
            const data = JSON.parse(jsonString);

            // อัปเดตสถานะของที่นั่งบนหน้าเว็บ
            data.forEach(seatData => {
                const seatElement = document.querySelector(`.seat[data-seat-id="${seatData['Seat ID']}"]`);
                if (seatElement) {
                    seatElement.setAttribute('data-status', seatData['Status']);
                    if (seatData['Status'] === 'Booked') {
                        seatElement.setAttribute('data-name', seatData['Name']);
                    }
                }
            });

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงสถานะ:', error);
        }
    };
    fetchSeatStatus();
    
    window.handleResponse = function(data) {}; // Dummy function for JSONP


    // ------------------------------------------------------------------
    // 2. ฟังก์ชันจัดการหลังส่งฟอร์ม (POST)
    // ------------------------------------------------------------------
    window.handleSuccessfulSubmission = function(response) {
        if (response.status === 'success') {
            alert(`🎉 การจองสำเร็จแล้ว!`);
            alert(`รบกวนส่งหลักฐานการชำระเงินมาที่ไลน์ส่วนตัวของคุณครู เพื่อยืนยันการจอง`);
            
            // ✅ โค้ดที่แก้ไข: อัปเดตสถานะใน DOM ทันที (แก้ปัญหาไม่ขึ้นสีแดง)
            if (selectedSeat) {
                selectedSeat.setAttribute('data-status', 'Booked'); 
                selectedSeat.setAttribute('data-name', submittedName); 
            }

            closeModal();
            // เรียก fetchSeatStatus ซ้ำ เพื่อยืนยันสถานะจากชีตอีกครั้ง
            fetchSeatStatus(); 
            
        } else if (response.status === 'error' && response.message.includes('ที่นั่งถูกจองแล้ว')) {
            alert(' Seat was booked ');
            closeModal();
            fetchSeatStatus(); // โหลดสถานะใหม่
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกการจอง กรุณาลองใหม่อีกครั้ง');
            console.error(response.message);
            closeModal();
        }
    };

    // ------------------------------------------------------------------
    // 3. Logic การจอง
    // ------------------------------------------------------------------
    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
        submittedName = ''; // ล้างชื่อผู้จอง
    };

    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            // ✅ โค้ดที่แก้ไข: ตรวจสอบและบล็อกการจองตั้งแต่การคลิก
            if (seat.getAttribute('data-status') === 'Booked') {
                alert(`ที่นั่งนี้ถูกจองแล้วโดย ${seat.getAttribute('data-name') || 'ผู้อื่น'}! กรุณาเลือกที่นั่งอื่น`);
                return; // หยุดการทำงานของโค้ด ไม่ให้เปิด Modal
            }
            
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                const deskInfo = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                currentDeskInfoStep1.textContent = deskInfo;
                currentDeskInfoStep2.textContent = deskInfo;
                
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
            }
        });
    });

    nextToFormButton.addEventListener('click', () => {
        transferDetails.style.display = 'none';
        bookingFormArea.style.display = 'block';
    });
    
    backToDetailsButton.addEventListener('click', () => {
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    });

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // ------------------------------------------------------------------
    // 4. การส่งฟอร์ม (Fetch API)
    // ------------------------------------------------------------------
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        if (!selectedSeat) return;

        const seatId = selectedSeat.getAttribute('data-seat-id');
        const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
        
        const formData = new FormData(bookingForm);
        formData.append('deskId', deskId);
        formData.append('seatId', seatId);
        
        submittedName = document.getElementById('name').value; // ✅ เก็บชื่อที่ส่ง
        formData.append('name', submittedName);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();
            window.handleSuccessfulSubmission(result); 

        } catch (error) {
            console.error("Error submitting form:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
            closeModal();
        }
    });
});

