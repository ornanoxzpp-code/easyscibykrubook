document.addEventListener('DOMContentLoaded', () => {
    
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
    
    // ID ปุ่มใหม่ตาม HTML
    const confirmBookingButton = document.getElementById('confirm-booking'); 
    const backToFormButton = document.getElementById('back-to-form'); 
    
    const currentDeskInfoStep1 = document.getElementById('current-desk-info-step1');
    const currentDeskInfoStep2 = document.getElementById('current-desk-info-step2');
    
    let selectedSeat = null; 
    let submittedName = ''; 
    
    
    // ------------------------------------------------------------------
    // 1. ฟังก์ชันดึงสถานะจาก Google Sheet (แก้ปัญหาสีหายเมื่อรีเฟรช)
    // ------------------------------------------------------------------
    const fetchSeatStatus = async () => {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?callback=handleResponse`);
            const text = await response.text();

            const jsonString = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
            const data = JSON.parse(jsonString);

            // โค้ดนี้จะอัปเดต data-status ตาม Sheet ตลอดเวลาที่โหลดหน้า
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
    
    window.handleResponse = function(data) {}; 


    // ------------------------------------------------------------------
    // 2. ฟังก์ชันจัดการหลังส่งฟอร์ม (POST)
    // ------------------------------------------------------------------
    window.handleSuccessfulSubmission = function(response) {
        if (response.status === 'success') {
            
            // แสดง Pop-up ตามที่ต้องการ
            alert(`🎉 จองสำเร็จ`);
            alert(`รบกวนส่งหลักฐานการโอนเงินที่ไลน์ส่วนตัวของคุณครูเพื่อยืนยันการจอง`);
            alert(`บุ๊คขอบคุณค่ะ`);
            
            // อัปเดตสถานะใน DOM ทันที (เพื่อให้สีแดงขึ้นทันที)
            if (selectedSeat) {
                selectedSeat.setAttribute('data-status', 'Booked'); 
                selectedSeat.setAttribute('data-name', submittedName); 
            }

            closeModal();
            fetchSeatStatus(); // ยืนยันสถานะจากชีตอีกครั้ง
            
        } else if (response.status === 'error' && response.message.includes('ที่นั่งถูกจองแล้ว')) {
            // กรณีมีคนจองไปแล้วระหว่างที่ Modal เปิดอยู่ 
            alert(' การจองสำเร็จแล้ว ');
            closeModal();
            fetchSeatStatus(); 
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกการจอง กรุณาลองใหม่อีกครั้ง');
            console.error(response.message);
            closeModal();
        }
    };

    // ------------------------------------------------------------------
    // 3. Logic การจองและ Modal
    // ------------------------------------------------------------------
    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
        submittedName = ''; 
        
        // รีเซ็ต Modal ให้กลับไปที่หน้ากรอกข้อมูล
        transferDetails.style.display = 'none';
        bookingFormArea.style.display = 'block'; 
    };

    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            // ไม่ต้องมี if/return เพราะ CSS (pointer-events: none) บล็อกการคลิกที่ Booked แล้ว
            
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                const deskInfo = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                currentDeskInfoStep1.textContent = deskInfo;
                currentDeskInfoStep2.textContent = deskInfo;
                
                // เปิด Modal และแสดงหน้ากรอกข้อมูลก่อน
                transferDetails.style.display = 'none';
                bookingFormArea.style.display = 'block';
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
            }
        });
    });

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // ------------------------------------------------------------------
    // 4. การจัดการปุ่ม: กรอกข้อมูลเสร็จ -> ดูรายละเอียดโอนเงิน
    // ------------------------------------------------------------------
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        // เก็บชื่อที่กรอกไว้
        submittedName = document.getElementById('name').value;
        
        // ไปหน้าโอนเงิน
        bookingFormArea.style.display = 'none';
        transferDetails.style.display = 'block';
    });

    // 5. ปุ่มย้อนกลับ
    backToFormButton.addEventListener('click', () => {
        transferDetails.style.display = 'none';
        bookingFormArea.style.display = 'block'; 
    });


    // ------------------------------------------------------------------
    // 6. การส่งฟอร์มจริง: ยืนยันการโอนเงิน -> POST ข้อมูล
    // ------------------------------------------------------------------
    confirmBookingButton.addEventListener('click', async () => {
        if (!selectedSeat) return;
        
        // ดึงค่าจากฟอร์มที่กรอกไว้ก่อนหน้า
        const classRoomValue = document.getElementById('classRoom').value; 

        const seatId = selectedSeat.getAttribute('data-seat-id');
        const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
        
        const formData = new FormData();
        formData.append('deskId', deskId);
        formData.append('seatId', seatId);
        formData.append('name', submittedName);
        formData.append('classRoom', classRoomValue);

        try {
            // การจองจะถูกทริกเกอร์เมื่อกดปุ่มยืนยันการโอนเงินนี้
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
